'use strict';

const { logger } = require('@hubiinetwork/logger');

const NestedError = require('../utils/nested-error');
const { getWalletReceiptFromNonce, getRecentWalletReceipts } = require('./receipts-provider');
const { getActiveBalance, getActiveBalanceAtBlock } = require('./balance-provider');
const ProgressNotifier = require('./progress-notifier');
const Proposal = require('./proposal');
const contracts = require('../contract-repository');
const t = require('../runtime-types');

const _wallet = new WeakMap;
const _gasLimitOpt = new WeakMap;
const _progressNotifier = new WeakMap;


function logReceipt (verdict, receipt, targetBalance) {
  logger.info(`    ${verdict}`);
  logger.info(`    Block    : ${receipt.blockNumber}`);
  logger.info(`    Sender   : address '${receipt.sender.wallet}', nonce '${receipt.sender.nonce}', balance '${receipt.sender.balances.current}', tau '${targetBalance}'`);
  logger.info(`    Recipient: address '${receipt.recipient.wallet}', nonce '${receipt.recipient.nonce}'`);
  logger.info(' ');
}


class ChallengeHandler {

  constructor(wallet, gasLimit) {
    t.NahmiiWallet().assert(wallet);

    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _wallet.set(this, wallet);
    _gasLimitOpt.set(this, { gasLimit: gasLimit });
    _progressNotifier.set(this, new ProgressNotifier());
  }

  get callbacks () {
    return _progressNotifier.get(this);
  }

  get notifier () {
    return _progressNotifier.get(this);
  }

  static async getProofCandidate(balanceTrackerContract, initiatorReceipts, initiator, ct, id, stagedAmount) {
    t.EthereumAddress().assert(initiator);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);
    t.EthersBigNumber().assert(stagedAmount);

    const activeBalance = await getActiveBalance(balanceTrackerContract, initiator, ct, id);
    const sortedReceipts = initiatorReceipts.sort((a, b) => a.party.nonce - b.party.nonce);
    const proofCandidate = { receipt: null, targetBalance: null };

    for (proofCandidate.receipt of sortedReceipts) {
      const blockNo = Number.parseInt(proofCandidate.receipt.blockNumber);
      const activeBalanceAtBlock = await getActiveBalanceAtBlock(balanceTrackerContract, initiator, ct, id, blockNo);
      const paymentBalanceAtBlock = proofCandidate.receipt.party.balances.current;
      proofCandidate.targetBalance = activeBalance.sub(activeBalanceAtBlock).add(paymentBalanceAtBlock).sub(stagedAmount);

      if (proofCandidate.targetBalance.lt(0))
        break;
    }

    return proofCandidate;
  }

  async handleDSCStart (initiator, nonce, cumulativeTransferAmount, stagedAmount, targetBalanceAmount, ct, id) {
    t.EthereumAddress().assert(initiator);
    t.EthersBigNumber().assert(nonce);
    t.EthersBigNumber().assert(cumulativeTransferAmount);
    t.EthersBigNumber().assert(stagedAmount);
    t.EthersBigNumber().assert(targetBalanceAmount);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    _progressNotifier.get(this).notifyDSCStart(initiator, nonce, stagedAmount);

    const proposal = new Proposal(await contracts.getDriipSettlementChallengeByPayment(), initiator, ct, id);
    const proposalState = await proposal.getProposalState();

    if (proposalState !== Proposal.IsChallengeable) {
      logger.info(`    SKIPPED: ${Proposal.getDescription(proposalState)}`);
      return;
    }

    const wallet = _wallet.get(this);

    const initiatorReceipt = await getWalletReceiptFromNonce(wallet.provider, initiator, nonce);
    const blockNo = Number.parseInt(initiatorReceipt.blockNumber);

    const recentPayments = await getRecentWalletReceipts(wallet.provider, initiator, ct, id, nonce, blockNo);
    const balanceTracker = await contracts.getBalanceTracker();

    const proofCandidate = await ChallengeHandler.getProofCandidate(balanceTracker, recentPayments, initiator, ct, id, stagedAmount);
    const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

    if (hasProof) {
      try {
        const finalReceipt = proofCandidate.receipt;
        const targetBalance = proofCandidate.targetBalance;
        const gasLimitOpt = _gasLimitOpt.get(this);
        const driipSettlementChallengeByPayment = (await contracts.getDriipSettlementChallengeByPayment()).connect(wallet);

        let disputeResult;

        try {
          await driipSettlementChallengeByPayment.challengeByPayment(initiator.toString(), finalReceipt, gasLimitOpt);
          disputeResult = 'ACCEPTED.';
        }
        catch (err) {
          disputeResult = 'REJECTED. ' + err.message;
        }

        if (/ACCEPTED/.test(disputeResult))
          _progressNotifier.get(this).notifyDSCDisputed(initiator, finalReceipt, targetBalance);

        logReceipt(`DSC Dispute ${disputeResult}`, finalReceipt, targetBalance.toString());
      }
      catch (err) {
        throw new NestedError(err, 'Failed to challenge by payment. ' + err.message);
      }
    }
    else {
      _progressNotifier.get(this).notifyDSCAgreed(initiator);
    }
  }

  async handleNSCStart (initiator, nonce, stagedAmount, targetBalanceAmount, ct, id) {
    t.EthereumAddress().assert(initiator);
    t.EthersBigNumber().assert(nonce);
    t.EthersBigNumber().assert(stagedAmount);
    t.EthersBigNumber().assert(targetBalanceAmount);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    _progressNotifier.get(this).notifyNSCStart(initiator, stagedAmount, ct, id);

    const proposal = new Proposal(await contracts.getNullSettlementChallengeByPayment(), initiator, ct, id);
    const proposalState = await proposal.getProposalState();

    if (proposalState !== Proposal.IsChallengeable) {
      logger.info(`    SKIPPED: ${Proposal.getDescription(proposalState)}`);
      return;
    }

    const balanceTracker = await contracts.getBalanceTracker();
    const recentReceipts = await getRecentWalletReceipts(_wallet.get(this).provider, initiator, ct, id, nonce, 0);
    const proofCandidate = await ChallengeHandler.getProofCandidate(balanceTracker, recentReceipts, initiator, ct, id, stagedAmount);
    const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

    if (hasProof) {
      const finalReceipt = proofCandidate.receipt;
      const targetBalance = proofCandidate.targetBalance;

      try {
        const wallet = _wallet.get(this);
        const gasLimitOpt = _gasLimitOpt.get(this);
        const nullSettlementChallengeByPayment = (await contracts.getNullSettlementChallengeByPayment()).connect(wallet);

        let disputeResult;

        try {
          await nullSettlementChallengeByPayment.challengeByPayment(initiator.toString(), finalReceipt, gasLimitOpt);
          disputeResult = 'ACCEPTED.';
        }
        catch (err) {
          disputeResult = 'REJECTED. ' + err.message;
        }

        if (/ACCEPTED/.test(disputeResult))
          _progressNotifier.get(this).notifyNSCDisputed(initiator, finalReceipt, targetBalance);

        logReceipt(`NSC Dispute ${disputeResult}`, finalReceipt, targetBalance.toString());
      }
      catch (err) {
        throw new NestedError(err, 'Failed to challenge null payment. ' + err.message);
      }
    }
    else {
      _progressNotifier.get(this).notifyNSCAgreed(initiator);
    }
  }

  async handleWalletLocked(caption, initiator, _nonce, _stageAmount, _targetBalanceAmount, ct, id, challenger) {
    t.EthereumAddress().assert(initiator);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);
    t.EthereumAddress().assert(challenger);

    const wallet = _wallet.get(this);

    if (challenger.isEqual(wallet.address)) {
      try {
        const signedClientFund = (await contracts.getClientFund()).connect(wallet);
        const gasLimitOpt = _gasLimitOpt.get(this);
        /*
          TODO: Activate seizing based on timeout of visible time
          const eth = '0x0000000000000000000000000000000000000000';
          const standard = (ct === eth) ? 'ETH' : 'ERC20';
          await signedClientFund.seizeBalances(challengedWallet, ct, id, standard, gasLimitOpt);
        */
      }
      catch (err) {
        throw new NestedError(err, 'Failed to seize balances. ' + err.message);
      }

      caption += ' SEIZING:';
    }
    else {
      caption += ' IGNORED (not mine):';
    }

    _progressNotifier.get(this).notifyWalletLocked(caption, challenger, initiator, ct, id);
  }

  handleBalancesSeized (initiator, challenger, value, ct, id) {
    t.EthereumAddress().assert(initiator);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);
    t.EthereumAddress().assert(challenger);

    const wallet = _wallet.get(this);
    const notifier = _progressNotifier.get(this);

    if (challenger.isEqual(wallet.address))
      notifier.notifyBalancesSeized('Seizing OK.', initiator, challenger, value, ct, id);
    else
      notifier.logBalancesSeized('Seizing IGNORED.', initiator, challenger, value, ct, id);
  }
}

module.exports = ChallengeHandler;
