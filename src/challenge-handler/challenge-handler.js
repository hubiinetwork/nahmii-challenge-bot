'use strict';

const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');
const ethers = require('ethers');
const { bigNumberify } = ethers.utils;
const { getWalletReceiptFromNonce, getResentSenderReceipts } = require('./receipts-provider');
const { getActiveBalance, getActiveBalanceAtBlock } = require('./balance-provider');

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

function logReceipt (verdict, receipt, targetBalance) {
  logger.info(`    ${verdict} by payment at block ${receipt.blockNumber}`);
  logger.info(`    Sender   : address '${receipt.sender.wallet}', nonce '${receipt.sender.nonce}', balance '${receipt.sender.balances.current}', tau '${targetBalance}'`);
  logger.info(`    Recipient: address '${receipt.recipient.wallet}', nonce '${receipt.recipient.nonce}'`);
  logger.info(' ');
}

function updateCallback(callbackName, callback) {
  const state = _state.get(this);
  state.callbacks[callbackName] = callback;
  _state.get(this, state);
}

function notifyCallback (callbackName, ...params) {
  const callback = _state.get(this).callbacks[callbackName];

  if (callback)
    callback(...params);
}

async function notifyDSCStart (initiator, nonce, stagedAmount) {
  logger.info(`Start DSC event: initiator ${initiator}, staged ${stagedAmount}, nonce ${nonce}`);
  notifyCallback.call(this, 'onDSCStart', initiator, nonce, stagedAmount);
}

function notifyDSCAgreed (sender, receipt, targetBalance) {
  logReceipt('DSC Agreed', receipt, targetBalance);
  notifyCallback.call(this, 'onDSCAgreed', sender, receipt, targetBalance);
}

function notifyDSCDisputed (sender, receipt, targetBalance) {
  logReceipt('DSC Disputed', receipt, targetBalance);
  notifyCallback.call(this, 'onDSCDisputed', sender, receipt, targetBalance);
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

function notifyNSCDisputed (initiatorAddress, receipt, targetBalance) {
  logReceipt('NSC Disputed', receipt, targetBalance);
  notifyCallback.call(this, 'onNSCDisputed', initiatorAddress, receipt, targetBalance);
}

function notifyWalletLocked (caption, challenger, lockedWallet, balance, ct, id) {
  logger.info(`${caption} challenger ${challenger}, sender ${lockedWallet}, balance ${balance}, ct ${ct}, id ${id}`);
  notifyCallback.call(this, 'onWalletLocked', challenger, lockedWallet, balance, ct, id);
}

function notifyBalancesSeized (wallet, nonce, candidateHash, challenger) {
  logger.info('    Balance seized');
  logger.info(`    Sender   : address '${wallet}'`);
  logger.info(' ');
  notifyCallback.call(this, 'onBalancesSeized', wallet, nonce, candidateHash, challenger);
}

async function handleDSCStart (initiatorAddress, initiatorNonce, cumulativeTransferAmount, stagedAmount, targetBalanceAmount, ct, id) {

  notifyDSCStart.call(this, initiatorAddress, initiatorNonce, stagedAmount);

  const state = _state.get(this);
  const contracts = state.contracts;

  const initiatorReceipt = await getWalletReceiptFromNonce(state.wallet.provider, initiatorAddress, initiatorNonce);
  const sender = initiatorReceipt.sender.wallet;
  const senderNonce = initiatorReceipt.sender.nonce;
  const blockNo = initiatorReceipt.blockNumber;

  const resentReceipts = await getResentSenderReceipts(state.wallet.provider, sender, ct, id, senderNonce, blockNo);
  const proofCandidate = await getProofCandidate(contracts.balanceTracker, resentReceipts, sender, ct, id, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance.lt(0);
  const finalReceipt = proofCandidate.receipt;
  const targetBalance = proofCandidate.targetBalance.toString();

  if (hasProof) {
    await contracts.driipSettlementChallengeByPayment.challengeByPayment(sender, finalReceipt, { gasLimit: state.gasLimit }).catch(err => {
      throw new NestedError(err, 'Failed to challenge by payment. ' + err.message);
    });
    notifyDSCDisputed.call(this, sender, finalReceipt, targetBalance);
  }
  else {
    notifyDSCAgreed.call(this, sender, finalReceipt, targetBalance);
  }
}

async function handleNSCStart (initiatorAddress, initiatorNonce, stagedAmount, targetBalanceAmount, ct, id) {

  notifyNSCStart.call(this, initiatorAddress, stagedAmount, ct, id);

  const state = _state.get(this);
  const contracts = state.contracts;

  const activeBalance = await getActiveBalance(contracts.balanceTracker, initiatorAddress, ct, id);

  if (activeBalance.lt(stagedAmount)) {
    const targetBalance = activeBalance.sub(stagedAmount).toString();
    throw new Error(`Received unexpected disqualified NSC: balance ${activeBalance.toString()}, staged ${stagedAmount.toString()}, tau ${targetBalance}`);
  }

  const resentReceipts = await getResentSenderReceipts(state.wallet.provider, initiatorAddress, ct, id, initiatorNonce, 0);
  const proofCandidate = await getProofCandidate(contracts.balanceTracker, resentReceipts, initiatorAddress, ct, id, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);

  if (hasProof) {
    const finalReceipt = proofCandidate.receipt;
    const targetBalance = proofCandidate.targetBalance.toString();

    await contracts.nullSettlementChallengeByPayment.challengeByPayment(initiatorAddress, finalReceipt, { gasLimit: state.gasLimit }).catch(err => {
      throw new NestedError(err, 'Failed to challenge null payment. ' + err.message);
    });

    notifyNSCDisputed.call(this, initiatorAddress, finalReceipt, targetBalance);
  }
  else {
    notifyNSCAgreed.call(this, initiatorAddress);
  }
}

/*
    struct Payment {
        uint256 nonce;

        int256 amount;
        MonetaryTypesLib.Currency currency;

        PaymentSenderParty sender;
        PaymentRecipientParty recipient;

        // Positive transfer is always in direction from sender to recipient
        NahmiiTypesLib.SingleTotalInt256 transfers;

        NahmiiTypesLib.WalletOperatorSeal seals;
        uint256 blockNumber;
        uint256 operatorId;
    }
*/

async function handleWalletLocking (caption, challengedWallet, challengedNonce, payment, challengerWallet) {

  const state = _state.get(this);

  if (challengedWallet.toLowerCase() !== payment[3][1].toLowerCase())
    throw new Error(`Handle lock event failed. Sender addresses do not match: payment address ${payment[3][1].toLowerCase()}, event address ${challengedWallet.toLowerCase()}`);

  if (challengerWallet.toLowerCase() === state.wallet.address.toLowerCase()) {
    await state.contracts.clientFund.seizeBalances(challengedWallet, payment[2][0], payment[2][1], '', { gasLimit: state.gasLimit }).catch(err => {
      throw new NestedError(err, 'Failed to seize balances. ' + err.message);
    });
    caption += ' seizing:';
  }
  else {
    caption += ' ignoring:';
  }

  notifyWalletLocked.call(this, caption, challengerWallet, challengedWallet, payment[2].toString(), payment[2][0], payment[2][1]);
}

function handleBalancesSeized (seizedWallet, seizerWallet, value, currencyCt, currencyId) {
  notifyBalancesSeized.call(this, seizedWallet, seizerWallet, value, currencyCt, currencyId);
}

class ChallengeHandler {

  constructor(wallet, gasLimit, clientFund, driipSettlementChallengeByPayment, nullSettlementChallengeByPayment, balanceTracker, driipSettlementDisputeByPayment, nullSettlementDisputeByPayment) {
    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _state.set(this, {
      wallet, gasLimit,
      contracts: {
        clientFund: clientFund.connect(wallet),
        driipSettlementChallengeByPayment: driipSettlementChallengeByPayment.connect(wallet),
        nullSettlementChallengeByPayment: nullSettlementChallengeByPayment.connect(wallet),
        balanceTracker, driipSettlementDisputeByPayment, nullSettlementDisputeByPayment
      },
      callbacks: {
        onDCStart: null, onDSCAgreed: null, onDSCDisputed: null,
        onNCStart: null, onNSCAgreed: null, onNSCDisputed: null,
        onWalletLocked: null, onBalancesSeized: null
      }
    });

    driipSettlementChallengeByPayment.on('StartChallengeFromPaymentEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id) => {
      handleDSCStart.call(this, wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    driipSettlementChallengeByPayment.on('StartChallengeFromPaymentByProxyEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      handleDSCStart.call(this, wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    driipSettlementDisputeByPayment.on('ChallengeByPaymentEvent', (challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      handleWalletLocking.call(this, 'DSC Locking', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    nullSettlementChallengeByPayment.on('StartChallengeEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id) => {
      handleNSCStart.call(this, wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    nullSettlementChallengeByPayment.on('StartChallengeByProxyEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      handleNSCStart.call(this, wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    nullSettlementDisputeByPayment.on('ChallengeByPaymentEvent', (challengedWallet, nonce, payment, challengerWallet) => {
      handleWalletLocking.call(this, 'NSC Locking', challengedWallet, nonce, payment, challengerWallet);
    });

    clientFund.on('SeizeBalancesEvent', (seizedWallet, seizerWallet, value, ct, id) => {
      handleBalancesSeized.call(this, seizedWallet, seizerWallet, value, ct, id);
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

  onNSCStart (callback) {
    updateCallback.call(this, 'onNSCStart', callback);
  }

  onNSCAgreed (callback) {
    updateCallback.call(this, 'onNSCAgreed', callback);
  }

  onNSCDisputed (callback) {
    updateCallback.call(this, 'onNSCDisputed', callback);
  }

  onWalletLocked (callback) {
    updateCallback.call(this, 'onWalletLocked', callback);
  }

  onBalancesSeized (callback) {
    updateCallback.call(this, 'onBalancesSeized', callback);
  }
}

module.exports = ChallengeHandler;
