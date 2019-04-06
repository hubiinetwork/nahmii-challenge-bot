'use strict';

const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');
const ethers = require('ethers');
const { bigNumberify } = ethers.utils;
const { getWalletReceiptFromHash, getResentSenderReceipts } = require('./receipts-provider');

const _state = new WeakMap;

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

function logLocking (caption, wallet, nonce, candidateHash, challenger) {
  logger.info(`${caption}`);
  logger.info(`    Sender   : address '${wallet}', nonce '${nonce}'`);
  logger.info(' ');
}

function notifyCallback (callbackName, ...params) {
  const callback = _state.get(this).callbacks[callbackName];

  if (callback)
    callback(...params);
}

async function notifyDSCStart (initiator, paymentHash, stagedAmount) {
  logger.info(`Start DSC event: initiator ${initiator}, staged ${stagedAmount}, hash ${paymentHash}`);
  notifyCallback.call(this, 'onDSCStart', initiator, paymentHash, stagedAmount);
}

function notifyDSCAgreed (sender, receipt, targetBalance) {
  logReceipt('DSC Agreed', receipt, targetBalance);
  notifyCallback.call(this, 'onDSCAgreed', sender, receipt, targetBalance);
}

function notifyDSCDisputed (sender, receipt, targetBalance) {
  logReceipt('DSC Disputed', receipt, targetBalance);
  notifyCallback.call(this, 'onDSCDisputed', sender, receipt, targetBalance);
}

function notifyDSCLocked (caption, challenger, lockedWallet, balance, ct, id) {
  logger.info(`${caption} challenger ${challenger}, sender ${lockedWallet}, balance ${balance}, ct ${ct}, id ${id}`);
  notifyCallback.call(this, 'onDSCLocked', challenger, lockedWallet, balance, ct, id);
}

function notifyNSCStart (initiator, stagedAmount, ct, id) {
  logger.info(`Start NSC event: initiator ${initiator}, staged ${stagedAmount}, ct ${ct}, id ${id}`);
  notifyCallback.call(this, 'onNSCStart', initiator, stagedAmount, ct, id);
}

function notifyNSCAgreed (sender) {
  logger.info('    NSC Agreed without payment');
  logger.info(`    Sender   : address '${sender}'`);
  logger.info(' ');
  notifyCallback.call(this, 'onNSCAgreed', sender);
}

function notifyNSCDisputed (sender, receipt, targetBalance) {
  logReceipt('NSC Disputed', receipt, targetBalance);
  notifyCallback.call(this, 'onNSCDisputed', sender, receipt, targetBalance);
}

function notifyNSCLocked (wallet, nonce, candidateHash, challenger) {
  logLocking('NSC Locked', wallet, nonce, candidateHash, challenger);
  notifyCallback.call(this, 'onNSCLocked', wallet, nonce, candidateHash, challenger);
}

function notifyBalancesSeized (wallet, nonce, candidateHash, challenger) {
  logger.info('    Balance seized');
  logger.info(`    Sender   : address '${wallet}'`);
  logger.info(' ');
  notifyCallback.call(this, 'onBalancesSeized', wallet, nonce, candidateHash, challenger);
}

async function handleDSCStart (initiatorAddress, paymentHash, stagedAmount) {

  notifyDSCStart.call(this, initiatorAddress, paymentHash, stagedAmount);

  const state = _state.get(this);
  const contracts = state.contracts;

  const initiatorReceipt = await getWalletReceiptFromHash(state.wallet.provider, initiatorAddress, paymentHash);
  const sender = initiatorReceipt.sender.wallet;
  const ct = initiatorReceipt.currency.ct;
  const id = initiatorReceipt.currency.id;
  const nonce = initiatorReceipt.sender.nonce;
  const blockNo = initiatorReceipt.blockNumber;

  const resentReceipts = await getResentSenderReceipts(state.wallet.provider, sender, ct, id, nonce, blockNo);
  const proofCandidate = await getProofCandidate(contracts.balanceTracker, resentReceipts, sender, ct, id, nonce, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance.lt(0);
  const finalReceipt = proofCandidate.receipt;
  const targetBalance = proofCandidate.targetBalance.toString();

  if (hasProof) {
    await contracts.driipSettlementChallenge.challengeByPayment(sender, finalReceipt).catch(err => {
      throw new NestedError(err, 'Failed to challenge by payment. ' + err.message);
    });
    notifyDSCDisputed.call(this, sender, finalReceipt, targetBalance);
  }
  else {
    notifyDSCAgreed.call(this, sender, finalReceipt, targetBalance);
  }
}

async function handleNSCStart (sender, stagedAmount, ct, id) {

  notifyNSCStart.call(this, sender, stagedAmount, ct, id);

  const state = _state.get(this);
  const contracts = state.contracts;

  const activeBalance = await getActiveBalance(contracts.balanceTracker, sender, ct, id);

  if (activeBalance.lt(stagedAmount)) {
    const targetBalance = activeBalance.sub(stagedAmount).toString();
    throw new Error(`Received unexpected disqualified NSC: balance ${activeBalance.toString()}, staged ${stagedAmount.toString()}, tau ${targetBalance}`);
  }

  const { blockNumber } = await getLastDepositRecord(contracts.balanceTracker, sender, ct, id);
  const senderNonce = 0;
  const resentReceipts = await getResentSenderReceipts(state.wallet.provider, sender, ct, id, senderNonce, blockNumber);
  const proofCandidate = await getProofCandidate(contracts.balanceTracker, resentReceipts, sender, ct, id, senderNonce, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

  if (hasProof) {
    const finalReceipt = proofCandidate.receipt;
    const targetBalance = proofCandidate.targetBalance.toString();

    await contracts.nullSettlementChallenge.challengeByPayment(sender, finalReceipt).catch(err => {
      throw new NestedError(err, 'Failed to challenge null payment. ' + err.message);
    });

    notifyNSCDisputed.call(this, sender, finalReceipt, targetBalance);
  }
  else {
    notifyNSCAgreed.call(this, sender);
  }
}

async function handleWalletLocking (caption, lockedWallet, nonce, candidateHash, challenger) {

  const state = _state.get(this);
  const candidateReceipt = await getWalletReceiptFromHash(state.wallet.provider, lockedWallet, candidateHash);
  const sender = candidateReceipt.sender.wallet;
  const balance = candidateReceipt.sender.balances.current;
  const ct = candidateReceipt.currency.ct;
  const id = candidateReceipt.currency.id;

  if (lockedWallet !== sender)
    throw new Error(`Handle lock event failed. Sender addresses do not match: address in event ${lockedWallet}, address in receipt ${sender}`)

  if (state.wallet.address === challenger) {
    const clientFund = state.contracts.clientFund.connect(state.wallet);
    clientFund.seizeBalances(lockedWallet, ct, id, '');
    caption += ' seizing:';
  }
  else {
    caption += ' ignoring:';
  }

  notifyDSCLocked.call(this, caption, challenger, lockedWallet, balance, ct, id);
}

function handleBalancesSeized (seizedWallet, seizerWallet, value, currencyCt, currencyId) {
  notifyBalancesSeized.call(this, seizedWallet, seizerWallet, value, currencyCt, currencyId);
}

function updateCallback(callbackName, callback) {
  const state = _state.get(this);
  state.callbacks[callbackName] = callback;
  _state.get(this, state);
}

class ChallengeHandler {

  constructor(wallet, clientFund, driipSettlementChallenge, nullSettlementChallenge, balanceTracker, driipSettlementDispute, nullSettlementDispute) {
    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _state.set(this, {
      wallet,
      contracts: {
        clientFund, driipSettlementChallenge, nullSettlementChallenge,
        balanceTracker, driipSettlementDispute, nullSettlementDispute
      },
      callbacks: {
        onDCStart: null, onDSCAgreed: null, onDSCDisputed: null, onDSCLocked: null,
        onNCStart: null, onNSCAgreed: null, onNSCDisputed: null, onNSCLocked: null,
        onBalancesSeized: null
      }
    });

    driipSettlementChallenge.on('StartChallengeFromPaymentEvent', (initiatorWallet, paymentHash, stagedAmount) => {
      handleDSCStart.call(this, initiatorWallet, paymentHash, stagedAmount);
    });

    driipSettlementChallenge.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
      handleDSCStart.call(this, initiatorWallet, paymentHash, stagedAmount);
    });

    driipSettlementDispute.on('ChallengeByPaymentEvent', (wallet, nonce, driipHash, driipType, candidateHash, challenger) => {
      handleWalletLocking.call(this, 'DSC Locking', wallet, nonce, candidateHash, challenger);
    });

    nullSettlementChallenge.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
      handleNSCStart.call(this, initiatorWallet, stagedAmount, stagedCt, stageId);
    });

    nullSettlementChallenge.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
      handleNSCStart.call(this, initiatorWallet, stagedAmount, stagedCt, stageId);
    });

    nullSettlementDispute.on('ChallengeByPaymentEvent', (wallet, nonce, candidateHash, challenger) => {
      handleWalletLocking.call(this, 'NSC Locking', wallet, nonce, candidateHash, challenger);
    });

    clientFund.on('SeizeBalancesEvent', (seizedWallet, seizerWallet, value, currencyCt, currencyId) => {
      handleBalancesSeized.call(this, seizedWallet, seizerWallet, value, currencyCt, currencyId);
    });
  }

  onDSCStart (callback) {
    updateCallback.call(this, 'onDSCStart', callback);
  }

  onDSCAgreed (callback) {
    updateCallback.call(this, 'onDSCAgreed', callback);
  }

  onDSCDisputed (callback) {
    updateCallback.call(this, 'onDSCDisputed', callback);
  }

  onDSCLocked (callback) {
    updateCallback.call(this, 'onDSCLocked', callback);
  }

  onNSCStart (callback) {
    updateCallback.call(this, 'onNSCStart', callback);
  }

  onNSCAgreed (callback) {
    updateCallback.call(this, 'onNSCAgreed', callback);
  }

  onNSCDisputed (callback) {
    updateCallback.call(this, 'onNSCDisputed', callback);
  }

  onNSCLocked (callback) {
    updateCallback.call(this, 'onNSCLocked', callback);
  }

  onBalancesSeized (callback) {
    updateCallback.call(this, 'onBalancesSeized', callback);
  }
}

module.exports = ChallengeHandler;
