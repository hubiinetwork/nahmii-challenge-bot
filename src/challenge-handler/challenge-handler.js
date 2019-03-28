'use strict';

const nahmii = require('nahmii-sdk');
const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');
const ethers = require('ethers');
const { bigNumberify } = ethers.utils;

const _wallet = new WeakMap;
const _onStartChallengeEventFromPaymentCallback = new WeakMap;
const _onStartChallengeEventCallback = new WeakMap;

const _driipSettlementChallengeContract = new WeakMap;
const _nullSettlementChallengeContract= new WeakMap;
const _balanceTrackerContract = new WeakMap;


async function getWalletReceipts(provider, address) {
  try {
    return await provider.getWalletReceipts(address, null, 100);
  }
  catch (err) {
    throw new NestedError(err, `Could not retrieve receipts for address ${address}`);
  }
}

async function getInitiatorReceipt(provider, address, hash) {
  const receipts = await getWalletReceipts(provider, address);
  const filtered = receipts.filter(receipt => receipt.seals.operator.hash === hash);

  if (filtered.length === 0)
    throw new Error(`Initiator receipts for address ${address} do not contain hash ${hash}`);

  return filtered[0];
}

async function getResentSenderReceipts(provider, sender, ct, id, nonce, blockNo) {
  const receipts = await getWalletReceipts(provider, sender);

  const filtered = receipts.filter(receipt =>
    (receipt.sender.wallet.toLowerCase() === sender.toLowerCase()) &&
    (receipt.currency.ct === ct) && (receipt.currency.id === id) &&
    (receipt.nonce >= nonce) && (receipt.blockNumber >= blockNo)
  );

  return filtered;
}

async function getActiveBalance (balanceTrackerContract, address, ct, id) {
  const balanceTypes = await NestedError.tryAwait(() => balanceTrackerContract.activeBalanceTypes());
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    const balance = await NestedError.tryAwait(() => balanceTrackerContract.get(address, balanceTypes[i], ct, bigNumberify(id)));
    activeBalance = activeBalance.add(balance);
  }

  return activeBalance;
}

async function getActiveBalanceAtBlock (balanceTrackerContract, address, ct, id, blockNo) {
  const balanceTypes = await NestedError.tryAwait(() => balanceTrackerContract.activeBalanceTypes());
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    const { amount } = await NestedError.tryAwait(() => balanceTrackerContract.fungibleRecordByBlockNumber(address, balanceTypes[i], ct, id, blockNo));
    activeBalance = activeBalance.add(amount);
  }

  return activeBalance;
}

async function getLastDepositRecord(balanceTrackerContract, sender, ct, id) {
  return NestedError.tryAwait(() => balanceTrackerContract.lastFungibleRecord(sender, balanceTrackerContract.depositedBalanceType(), ct, id));
}

async function getProofCandidate(balanceTrackerContract, senderReceipts, sender, ct, id, nonce, stagedAmount) {

  const activeBalance = await getActiveBalance(balanceTrackerContract, sender, ct, id);

  let runningNonce = nonce;
  const proofCandidate = { receipt: null, targetBalance: null };

  for (proofCandidate.receipt of senderReceipts.sort((a, b) => a.nonce - b.nonce)) {
    if (proofCandidate.receipt.sender.nonce !== runningNonce)
      throw new Error(`Receipt has wrong nonce. Expected ${runningNonce}, found ${proofCandidate.receipt.nonce}`);

    const activeBalanceAtBlock = await getActiveBalanceAtBlock(balanceTrackerContract, sender, ct, id, proofCandidate.blockNumber);
    const paymentBalanceAtBlock = proofCandidate.receipt.sender.balances.current;
    proofCandidate.targetBalance = activeBalance.sub(activeBalanceAtBlock).add(paymentBalanceAtBlock).sub(stagedAmount);

    if (proofCandidate.targetBalance.lt(0))
      break;

    ++runningNonce;
  }

  return proofCandidate;
}

async function handleDriipSettlement (initiatorAddress, paymentHash, stagedAmount) {

  logger.info(`StartChallengeFromPaymentEvent: initiator ${initiatorAddress}, staged ${stagedAmount}, hash ${paymentHash}`);

  const initiatorReceipt = await getInitiatorReceipt(_wallet.get(this).provider, initiatorAddress, paymentHash);
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

  if (hasProof)
    await NestedError.tryAwait(() => _driipSettlementChallengeContract.get(this).challengeByPayment(sender, finalReceipt));

  logger.info(`    ${hasProof ? 'Disputed' : 'Approved'} by payment at block ${finalReceipt.blockNumber}`);
  logger.info(`    Sender   : address ${finalReceipt.sender.wallet}, nonce ${finalReceipt.sender.nonce}, balance ${finalReceipt.sender.balances.current}, tau ${targetBalance}`);
  logger.info(`    Recipient: address ${finalReceipt.recipient.wallet}, nonce ${finalReceipt.recipient.nonce}`);

  logger.info(' ');
}

async function handleNullSettlement (sender, stagedAmount, ct, id) {
  logger.info(`StartChallengeEvent: initiator ${sender}, staged ${stagedAmount}, ct ${ct}, id ${id}`);

  const activeBalance = await getActiveBalance(_balanceTrackerContract.get(this), sender, ct, id);

  if (activeBalance.lt(stagedAmount)) {
    const targetBalance = activeBalance.sub(stagedAmount).toString();
    throw new Error(`Received unexpected disqualified NSC: balance ${activeBalance.toString()}, staged ${stagedAmount.toString()}, tau ${targetBalance}`);
  }

  const { blockNumber } = await getLastDepositRecord(_balanceTrackerContract.get(this), sender, ct, id);
  const nonce = 0;
  const resentReceipts = await getResentSenderReceipts(_wallet.get(this).provider, sender, ct, id, nonce, blockNumber);
  const proofCandidate = await getProofCandidate(_balanceTrackerContract.get(this), resentReceipts, sender, ct, id, nonce, stagedAmount.toString());
  const hasProof = proofCandidate.targetBalance && proofCandidate.targetBalance.lt(0);
  const finalReceipt = proofCandidate.receipt;

  if (hasProof)
    await NestedError.tryAwait(() => _nullSettlementChallengeContract.get(this).challengeByPayment(sender, proofCandidate.receipt));

  if (proofCandidate.receipt) {
    const targetBalance = proofCandidate.targetBalance.toString();
    logger.info(`    ${hasProof ? 'Disputed' : 'Approved'} by payment at block ${finalReceipt.blockNumber}`);
    logger.info(`    Sender   : address ${finalReceipt.sender.wallet}, nonce ${finalReceipt.sender.nonce}, balance ${finalReceipt.sender.balances.current}, tau ${targetBalance}`);
    logger.info(`    Recipient: address ${finalReceipt.recipient.wallet}, nonce ${finalReceipt.recipient.nonce}`);
  }
  else {
    logger.info('    Approved without receipts');
  }

  logger.info(' ');
}

async function handleStartChallengeFromPaymentEvent (initiatorAddress, paymentHash, stagedAmount) {
  if (_onStartChallengeEventFromPaymentCallback.get(this))
    _onStartChallengeEventFromPaymentCallback.get(this)(initiatorAddress, paymentHash, stagedAmount);

  handleDriipSettlement.call(this, initiatorAddress, paymentHash, stagedAmount);
}

async function handleStartChallengeEvent (initiatorWallet, stagedAmount, ct, id) {
  if (_onStartChallengeEventCallback.get(this))
    _onStartChallengeEventCallback.get(this)(initiatorWallet, stagedAmount, ct, id);

  handleNullSettlement.call(this, initiatorWallet, stagedAmount, ct, id.toString());
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
      handleStartChallengeFromPaymentEvent.call(this, initiatorWallet, paymentHash, stagedAmount);
    });

    driipSettlementChallengeContract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
      handleStartChallengeFromPaymentEvent.call(this, initiatorWallet, paymentHash, stagedAmount);
    });

    nullSettlementChallengeContract.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
      handleStartChallengeEvent.call(this, initiatorWallet, stagedAmount, stagedCt, stageId);
    });

    nullSettlementChallengeContract.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
      handleStartChallengeEvent.call(this, initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  }

  onStartChallengeFromPaymentEvent (callback) {
    _onStartChallengeEventFromPaymentCallback.set(this, callback);
  }

  onStartChallengeEvent (callback) {
    _onStartChallengeEventCallback.set(this, callback);
  }
}

module.exports = ChallengeHandler;
