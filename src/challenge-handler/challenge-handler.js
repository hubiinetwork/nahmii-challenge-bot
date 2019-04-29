'use strict';

const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');
const { getWalletReceiptFromNonce, getResentSenderReceipts } = require('./receipts-provider');
const { getActiveBalance, getActiveBalanceAtBlock } = require('./balance-provider');
const ProgressNotifyer = require('./progress-notifier');

const _state = new WeakMap;

async function getProofCandidate(balanceTrackerContract, senderReceipts, sender, ct, id, stagedAmount) {

  const activeBalance = await getActiveBalance(balanceTrackerContract, sender, ct, id);
  const sortedReceipts = senderReceipts.sort((a, b) => a.sender.nonce - b.sender.nonce);
  let runningNonce = sortedReceipts.length > 0 ? sortedReceipts[0].sender.nonce : 0;
  const proofCandidate = { receipt: null, targetBalance: null };

  for (proofCandidate.receipt of sortedReceipts) {
    if (proofCandidate.receipt.sender.nonce !== runningNonce)
      throw new Error(`Receipt has wrong nonce. Expected ${runningNonce}, found ${proofCandidate.receipt.nonce}`);

    const activeBalanceAtBlock = await getActiveBalanceAtBlock(balanceTrackerContract, sender, ct, id, proofCandidate.receipt.blockNumber);
    const paymentBalanceAtBlock = proofCandidate.receipt.sender.balances.current;
    proofCandidate.targetBalance = activeBalance.sub(activeBalanceAtBlock).add(paymentBalanceAtBlock).sub(stagedAmount);

    if (proofCandidate.targetBalance.lt(0))
      break;

    ++runningNonce;
  }

  return proofCandidate;
}

async function handleDSCStart (initiator, nonce, cumulativeTransferAmount, stagedAmount, targetBalanceAmount, ct, id) {

  const state = _state.get(this);
  const contracts = state.contracts;
  const notifyer = state.progressNotifyer;

  notifyer.notifyDSCStart(initiator, nonce, stagedAmount);

  const initiatorReceipt = await getWalletReceiptFromNonce(state.wallet.provider, initiator, nonce.toNumber());
  const blockNo = initiatorReceipt.blockNumber;

  const resentPayments = await getResentSenderReceipts(state.wallet.provider, initiator, ct, id, nonce, blockNo);

  const proofCandidate = await getProofCandidate(contracts.balanceTracker, resentPayments, initiator, ct, id, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance.lt(0);
  const finalReceipt = proofCandidate.receipt;
  const targetBalance = proofCandidate.targetBalance.toString();

  if (hasProof) {
    await contracts.driipSettlementChallengeByPayment.challengeByPayment(initiator, finalReceipt, { gasLimit: state.gasLimit }).catch(err => {
      throw new NestedError(err, 'Failed to challenge by payment. ' + err.message);
    });
    notifyer.notifyDSCDisputed(initiator, finalReceipt, targetBalance);
  }
  else {
    notifyer.notifyDSCAgreed(initiator, finalReceipt, targetBalance);
  }
}

async function handleNSCStart (initiator, nonce, stagedAmount, targetBalanceAmount, ct, id) {

  const state = _state.get(this);
  const contracts = state.contracts;
  const notifyer = state.progressNotifyer;

  notifyer.notifyNSCStart(initiator, stagedAmount, ct, id);

  const activeBalance = await getActiveBalance(contracts.balanceTracker, initiator, ct, id);

  if (activeBalance.lt(stagedAmount)) {
    const targetBalance = activeBalance.sub(stagedAmount).toString();
    throw new Error(`Received unexpected disqualified NSC: balance ${activeBalance.toString()}, staged ${stagedAmount.toString()}, tau ${targetBalance}`);
  }

  const resentReceipts = await getResentSenderReceipts(state.wallet.provider, initiator, ct, id, nonce, 0);
  const proofCandidate = await getProofCandidate(contracts.balanceTracker, resentReceipts, initiator, ct, id, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

  if (hasProof) {
    const finalReceipt = proofCandidate.receipt;
    const targetBalance = proofCandidate.targetBalance.toString();

    await contracts.nullSettlementChallengeByPayment.challengeByPayment(initiator, finalReceipt, { gasLimit: state.gasLimit }).catch(err => {
      throw new NestedError(err, 'Failed to challenge null payment. ' + err.message);
    });

    notifyer.notifyNSCDisputed(initiator, finalReceipt, targetBalance);
  }
  else {
    notifyer.notifyNSCAgreed(initiator);
  }
}

async function handleWalletLocked(caption, challengedWallet, challengedNonce, payment, challengerWallet) {

  const state = _state.get(this);
  const notifyer = state.progressNotifyer;

  if (challengedWallet.toLowerCase() !== payment[3][1].toLowerCase())
    throw new Error(`Handle lock event failed. Sender addresses do not match: payment address ${payment[3][1].toLowerCase()}, event address ${challengedWallet.toLowerCase()}`);

  if (challengerWallet.toLowerCase() === state.wallet.address.toLowerCase()) {
    logger.error('SEIZE not implemented');
    /*
    await state.contracts.clientFund.seizeBalances(challengedWallet, payment[2][0], payment[2][1], '', { gasLimit: state.gasLimit }).catch(err => {
      throw new NestedError(err, 'Failed to seize balances. ' + err.message);
    });
    */
    caption += ' seizing:';
  }
  else {
    caption += ' Not my dispute. ignoring:';
  }

  notifyer.notifyWalletLocked(caption, challengerWallet, challengedWallet, payment[2][0], payment[2][1]);
}

function handleBalancesSeized (seizedWallet, seizerWallet, value, currencyCt, currencyId) {
  const state = _state.get(this);
  const notifyer = state.progressNotifyer;
  notifyer.notifyBalancesSeized(seizedWallet, seizerWallet, value, currencyCt, currencyId);
}

class ChallengeHandler {

  constructor(wallet, gasLimit, clientFund, driipSettlementChallengeByPayment, nullSettlementChallengeByPayment, balanceTracker, driipSettlementDisputeByPayment, nullSettlementDisputeByPayment) {
    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _state.set(this, {
      wallet, gasLimit, progressNotifyer: new ProgressNotifyer(),
      contracts: {
        clientFund: clientFund.connect(wallet),
        driipSettlementChallengeByPayment: driipSettlementChallengeByPayment.connect(wallet),
        nullSettlementChallengeByPayment: nullSettlementChallengeByPayment.connect(wallet),
        balanceTracker, driipSettlementDisputeByPayment, nullSettlementDisputeByPayment
      }
    });

    driipSettlementChallengeByPayment.on('StartChallengeFromPaymentEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id) => {
      handleDSCStart.call(this, wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    driipSettlementChallengeByPayment.on('StartChallengeFromPaymentByProxyEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      handleDSCStart.call(this, wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    driipSettlementDisputeByPayment.on('ChallengeByPaymentEvent', (challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      handleWalletLocked.call(this, 'DSC Locked', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    nullSettlementChallengeByPayment.on('StartChallengeEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id) => {
      handleNSCStart.call(this, wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    nullSettlementChallengeByPayment.on('StartChallengeByProxyEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      handleNSCStart.call(this, wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    nullSettlementDisputeByPayment.on('ChallengeByPaymentEvent', (challengedWallet, nonce, payment, challengerWallet) => {
      handleWalletLocked.call(this, 'NSC Locked', challengedWallet, nonce, payment, challengerWallet);
    });

    clientFund.on('SeizeBalancesEvent', (seizedWallet, seizerWallet, value, ct, id) => {
      handleBalancesSeized.call(this, seizedWallet, seizerWallet, value, ct, id);
    });
  }

  get callbacks () {
    return _state.get(this).progressNotifyer;
  }
}

module.exports = ChallengeHandler;
