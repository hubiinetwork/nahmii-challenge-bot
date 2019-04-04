'use strict';

const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');
const ethers = require('ethers');
const { bigNumberify } = ethers.utils;
const { getWalletReceiptFromHash, getResentSenderReceipts } = require('./receipts-provider');

const _wallet = new WeakMap;

const _onDSCEventCallback = new WeakMap;
const _onDSCAgreedCallback = new WeakMap;
const _onDSCDisputedCallback = new WeakMap;

const _onNSCEventCallback = new WeakMap;
const _onNSCAgreedCallback = new WeakMap;
const _onNSCDisputedCallback = new WeakMap;

const _driipSettlementChallengeContract = new WeakMap;
const _nullSettlementChallengeContract= new WeakMap;
const _balanceTrackerContract = new WeakMap;

async function getActiveBalanceTypes (balanceTrackerContract) {
  return balanceTrackerContract.activeBalanceTypes().catch(err => {
    throw new NestedError(err, 'Failed to get active balance types. ' + err.message);
  });
}

async function getActiveBalance (balanceTrackerContract, address, ct, id) {
  const balanceTypes = await getActiveBalanceTypes(balanceTrackerContract);
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    const balance = await balanceTrackerContract.get(address, balanceTypes[i], ct, bigNumberify(id)).catch(err => {
      throw new NestedError(err, 'Failed to get balance. ' + err.message);
    });
    activeBalance = activeBalance.add(balance);
  }

  return activeBalance;
}

async function getActiveBalanceAtBlock (balanceTrackerContract, address, ct, id, blockNo) {
  const balanceTypes = getActiveBalanceTypes(balanceTrackerContract);
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    const { amount } = await balanceTrackerContract.fungibleRecordByBlockNumber(address, balanceTypes[i], ct, id, blockNo).catch(err => {
      throw new NestedError(err, 'Failed to get tracker record. ' + err.message);
    });
    activeBalance = activeBalance.add(amount);
  }

  return activeBalance;
}

async function getLastDepositRecord(balanceTrackerContract, sender, ct, id) {
  return balanceTrackerContract.lastFungibleRecord(sender, balanceTrackerContract.depositedBalanceType(), ct, id).catch(err => {
    throw new NestedError(err, 'Failed to get tracker record. ' + err.message);
  });
}

async function getProofCandidate(balanceTrackerContract, senderReceipts, sender, ct, id, nonce, stagedAmount) {

  const activeBalance = await getActiveBalance(balanceTrackerContract, sender, ct, id);

  let runningNonce = nonce;
  const proofCandidate = { receipt: null, targetBalance: null };

  for (proofCandidate.receipt of senderReceipts.sort((a, b) => a.nonce - b.nonce)) {
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

function logReceipt (verdict, receipt, targetBalance) {
  logger.info(`    ${verdict} by payment at block ${receipt.blockNumber}`);
  logger.info(`    Sender   : address '${receipt.sender.wallet}', nonce '${receipt.sender.nonce}', balance '${receipt.sender.balances.current}', tau '${targetBalance}'`);
  logger.info(`    Recipient: address '${receipt.recipient.wallet}', nonce '${receipt.recipient.nonce}'`);

  logger.info(' ');
}

async function notifyDSCEvent (initiator, paymentHash, stagedAmount) {
  logger.info(`Start DSC event: initiator ${initiator}, staged ${stagedAmount}, hash ${paymentHash}`);

  if (_onDSCEventCallback.get(this))
    _onDSCEventCallback.get(this)(initiator, paymentHash, stagedAmount);
}

function notifyDSCAgreed (sender, receipt, targetBalance) {
  logReceipt('DSC Agreed', receipt, targetBalance);

  if (_onDSCAgreedCallback.get(this))
    _onDSCAgreedCallback.get(this)(sender, receipt, targetBalance);
}

function notifyDSCDisputed (sender, receipt, targetBalance) {
  logReceipt('DSC Disputed', receipt, targetBalance);

  if (_onDSCDisputedCallback.get(this))
    _onDSCDisputedCallback.get(this)(sender, receipt, targetBalance);
}

async function notifyNSCEvent (initiator, stagedAmount, ct, id) {
  logger.info(`Start NSC event: initiator ${initiator}, staged ${stagedAmount}, ct ${ct}, id ${id}`);

  if (_onNSCEventCallback.get(this))
    _onNSCEventCallback.get(this)(initiator, stagedAmount, ct, id);
}

function notifyNSCAgreed (sender) {
  logger.info('    NSC Agreed without payment');
  logger.info(`    Sender   : address '${sender}'`);

  logger.info(' ');

  if (_onNSCAgreedCallback.get(this))
    _onNSCAgreedCallback.get(this)(sender);
}

function notifyNSCDisputed (sender, receipt, targetBalance) {
  logReceipt('NSC Disputed', receipt, targetBalance);

  if (_onNSCDisputedCallback.get(this))
    _onNSCDisputedCallback.get(this)(sender, receipt, targetBalance);
}

async function handleDSCEvent (initiatorAddress, paymentHash, stagedAmount) {

  notifyDSCEvent.call(this, initiatorAddress, paymentHash, stagedAmount);

  const initiatorReceipt = await getWalletReceiptFromHash(_wallet.get(this).provider, initiatorAddress, paymentHash);
  const sender = initiatorReceipt.sender.wallet;
  const ct = initiatorReceipt.currency.ct;
  const id = initiatorReceipt.currency.id;
  const nonce = initiatorReceipt.sender.nonce;
  const blockNo = initiatorReceipt.blockNumber;

  const resentReceipts = await getResentSenderReceipts(_wallet.get(this).provider, sender, ct, id, nonce, blockNo);
  const proofCandidate = await getProofCandidate(_balanceTrackerContract.get(this), resentReceipts, sender, ct, id, nonce, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance.lt(0);
  const finalReceipt = proofCandidate.receipt;
  const targetBalance = proofCandidate.targetBalance.toString();

  if (hasProof) {
    await _driipSettlementChallengeContract.get(this).challengeByPayment(sender, finalReceipt).catch(err => {
      throw new NestedError(err, 'Failed to challenge by payment. ' + err.message);
    });
    notifyDSCDisputed.call(this, sender, finalReceipt, targetBalance);
  }
  else {
    notifyDSCAgreed.call(this, sender, finalReceipt, targetBalance);
  }
}

async function handleNSCEvent (sender, stagedAmount, ct, id) {

  notifyNSCEvent.call(this, sender, stagedAmount, ct, id);

  const activeBalance = await getActiveBalance(_balanceTrackerContract.get(this), sender, ct, id);

  if (activeBalance.lt(stagedAmount)) {
    const targetBalance = activeBalance.sub(stagedAmount).toString();
    throw new Error(`Received unexpected disqualified NSC: balance ${activeBalance.toString()}, staged ${stagedAmount.toString()}, tau ${targetBalance}`);
  }

  const { blockNumber } = await getLastDepositRecord(_balanceTrackerContract.get(this), sender, ct, id);
  const senderNonce = 0;
  const resentReceipts = await getResentSenderReceipts(_wallet.get(this).provider, sender, ct, id, senderNonce, blockNumber);
  const proofCandidate = await getProofCandidate(_balanceTrackerContract.get(this), resentReceipts, sender, ct, id, senderNonce, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

  if (hasProof) {
    const finalReceipt = proofCandidate.receipt;
    const targetBalance = proofCandidate.targetBalance.toString();

    await _nullSettlementChallengeContract.get(this).challengeByPayment(sender, finalReceipt).catch(err => {
      throw new NestedError(err, 'Failed to challenge null payment. ' + err.message);
    });

    notifyNSCDisputed.call(this, sender, finalReceipt, targetBalance);
  }
  else {
    notifyNSCAgreed.call(this, sender);
  }
}

class ChallengeHandler {

  constructor(wallet, driipSettlementChallengeContract, nullSettlementChallengeContract, balanceTrackerContract) {
    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _wallet.set(this, wallet);
    _driipSettlementChallengeContract.set(this, driipSettlementChallengeContract);
    _nullSettlementChallengeContract.set(this, nullSettlementChallengeContract);
    _balanceTrackerContract.set(this, balanceTrackerContract);

    driipSettlementChallengeContract.on('StartChallengeFromPaymentEvent', (initiatorWallet, paymentHash, stagedAmount) => {
      handleDSCEvent.call(this, initiatorWallet, paymentHash, stagedAmount);
    });

    driipSettlementChallengeContract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
      handleDSCEvent.call(this, initiatorWallet, paymentHash, stagedAmount);
    });

    nullSettlementChallengeContract.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
      handleNSCEvent.call(this, initiatorWallet, stagedAmount, stagedCt, stageId);
    });

    nullSettlementChallengeContract.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
      handleNSCEvent.call(this, initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  }

  onDSCEvent (callback) {
    _onDSCEventCallback.set(this, callback);
  }

  onDSCAgreed (callback) {
    _onDSCAgreedCallback.set(this, callback);
  }

  onDSCDisputed (callback) {
    _onDSCDisputedCallback.set(this, callback);
  }

  onNSCEvent (callback) {
    _onNSCEventCallback.set(this, callback);
  }

  onNSCAgreed (callback) {
    _onNSCAgreedCallback.set(this, callback);
  }

  onNSCDisputed (callback) {
    _onNSCDisputedCallback.set(this, callback);
  }
}

module.exports = ChallengeHandler;
