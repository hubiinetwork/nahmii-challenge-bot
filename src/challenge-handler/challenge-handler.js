'use strict';

const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');

const { getWalletReceiptFromNonce, getRecentSenderReceipts } = require('./receipts-provider');
const { getActiveBalance, getActiveBalanceAtBlock } = require('./balance-provider');
const ProgressNotifier = require('./progress-notifier');
const contracts = require('./contract-repository');

const _wallet = new WeakMap;
const _gasLimitOpt = new WeakMap;
const _progressNotifier = new WeakMap;

class ChallengeHandler {

  constructor(wallet, gasLimit) {
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

  static async getProofCandidate(balanceTrackerContract, senderReceipts, sender, ct, id, stagedAmount) {

    const activeBalance = await getActiveBalance(balanceTrackerContract, sender, ct, id);
    const sortedReceipts = senderReceipts.sort((a, b) => a.sender.nonce - b.sender.nonce);
    const proofCandidate = { receipt: null, targetBalance: null };

    for (proofCandidate.receipt of sortedReceipts) {
      const activeBalanceAtBlock = await getActiveBalanceAtBlock(balanceTrackerContract, sender, ct, id, proofCandidate.receipt.blockNumber);
      const paymentBalanceAtBlock = proofCandidate.receipt.sender.balances.current;
      proofCandidate.targetBalance = activeBalance.sub(activeBalanceAtBlock).add(paymentBalanceAtBlock).sub(stagedAmount);

      if (proofCandidate.targetBalance.lt(0))
        break;
    }

    return proofCandidate;
  }

  async handleDSCStart (initiator, nonce, cumulativeTransferAmount, stagedAmount, targetBalanceAmount, ct, id) {
    _progressNotifier.get(this).notifyDSCStart(initiator, nonce, stagedAmount);

    const wallet = _wallet.get(this);

    const initiatorReceipt = await getWalletReceiptFromNonce(wallet.provider, initiator, nonce.toNumber());
    const blockNo = initiatorReceipt.blockNumber;

    const recentPayments = await getRecentSenderReceipts(wallet.provider, initiator, ct, id, nonce, blockNo);
    const balanceTracker = await contracts.getBalanceTracker();

    const proofCandidate = await ChallengeHandler.getProofCandidate(balanceTracker, recentPayments, initiator, ct, id, stagedAmount.toString());
    const hasProof = proofCandidate.targetBalance.lt(0);
    const finalReceipt = proofCandidate.receipt;
    const targetBalance = proofCandidate.targetBalance.toString();

    if (hasProof) {
      try {
        const gasLimitOpt = _gasLimitOpt.get(this);
        const driipSettlementChallengeByPayment = (await contracts.getDriipSettlementChallengeByPayment()).connect(wallet);
        await driipSettlementChallengeByPayment.challengeByPayment(initiator, finalReceipt, gasLimitOpt);
        _progressNotifier.get(this).notifyDSCDisputed(initiator, finalReceipt, targetBalance);
      }
      catch (err) {
        throw new NestedError(err, 'Failed to challenge by payment. ' + err.message);
      }
    }
    else {
      _progressNotifier.get(this).notifyDSCAgreed(initiator, finalReceipt, targetBalance);
    }
  }

  async handleNSCStart (initiator, nonce, stagedAmount, targetBalanceAmount, ct, id) {
    _progressNotifier.get(this).notifyNSCStart(initiator, stagedAmount, ct, id);

    const balanceTracker = await contracts.getBalanceTracker();
    const activeBalance = await getActiveBalance(balanceTracker, initiator, ct, id);

    if (activeBalance.lt(stagedAmount)) {
      const targetBalance = activeBalance.sub(stagedAmount).toString();
      throw new Error(`Received unexpected disqualified NSC: balance ${activeBalance.toString()}, staged ${stagedAmount.toString()}, tau ${targetBalance}`);
    }

    const recentReceipts = await getRecentSenderReceipts(_wallet.get(this).provider, initiator, ct, id, nonce, 0);
    const proofCandidate = await ChallengeHandler.getProofCandidate(balanceTracker, recentReceipts, initiator, ct, id, stagedAmount.toString());
    const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

    if (hasProof) {
      const finalReceipt = proofCandidate.receipt;
      const targetBalance = proofCandidate.targetBalance.toString();

      try {
        const wallet = _wallet.get(this);
        const gasLimitOpt = _gasLimitOpt.get(this);
        const nullSettlementChallengeByPayment = (await contracts.getNullSettlementChallengeByPayment()).connect(wallet);
        await nullSettlementChallengeByPayment.challengeByPayment(initiator, finalReceipt, gasLimitOpt);
        _progressNotifier.get(this).notifyNSCDisputed(initiator, finalReceipt, targetBalance);
      }
      catch (err) {
        throw new NestedError(err, 'Failed to challenge null payment. ' + err.message);
      }
    }
    else {
      _progressNotifier.get(this).notifyNSCAgreed(initiator);
    }
  }

  async handleWalletLocked(caption, challengedWallet, challengedNonce, payment, challengerWallet) {
    if (challengedWallet.toLowerCase() !== payment[3][1].toLowerCase())
      throw new Error(`Handle lock event failed. Sender addresses do not match: payment address ${payment[3][1].toLowerCase()}, event address ${challengedWallet.toLowerCase()}`);

    if (challengerWallet.toLowerCase() === _wallet.get(this).address.toLowerCase()) {
      logger.error('SEIZE not implemented');
      /*
      TODO: Implement as sketched below
      try {
        const wallet = _wallet.get(this);
        const clientFund = (await contracts.getClientFund()).connect(wallet);
        await clientFund.seizeBalances(challengedWallet, payment[2][0], payment[2][1], '', _gasLimitOpt.get(this));
      }
      catch (err) {
        throw new NestedError(err, 'Failed to seize balances. ' + err.message);
      }
      */
      caption += ' seizing:';
    }
    else {
      caption += ' Not my dispute. ignoring:';
    }

    _progressNotifier.get(this).notifyWalletLocked(caption, challengerWallet, challengedWallet, payment[2][0], payment[2][1]);
  }

  handleBalancesSeized (seizedWallet, seizerWallet, value, currencyCt, currencyId) {
    _progressNotifier.get(this).notifyBalancesSeized(seizedWallet, seizerWallet, value, currencyCt, currencyId);
  }
}

module.exports = ChallengeHandler;
