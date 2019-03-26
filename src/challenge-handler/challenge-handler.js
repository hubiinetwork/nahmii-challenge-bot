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

async function getNewSenderReceipts(receipts, initiatorReceipt) {
  const sender = initiatorReceipt.sender.wallet;
  const nonce = initiatorReceipt.sender.nonce;
  const ct = initiatorReceipt.currency.ct;
  const id = initiatorReceipt.currency.id;

  if (receipts.length === 0)
    throw new Error(`No receipts found for address ${sender}`);

  const filtered = receipts.filter(receipt =>
    (receipt.sender.wallet.toLowerCase() === sender.toLowerCase()) && (receipt.nonce >= nonce) && (receipt.currency.ct === ct) && (receipt.currency.id === id)
  );

  if (filtered.length === 0)
    throw new Error(`No matching receipts for address ${sender} with nonce ${nonce}, ct ${ct}, id ${id}`);

  return filtered;
}
/*
async function getNahmiiBalance(provider, address, currency) {
  let balances;

  try {
    balances = await provider.getNahmiiBalances(address);
  }
  catch (err) {
    throw new NestedError(err, `Could not retrieve nahmii balances for address ${address}`);
  }

  if (balances.length === 0)
    throw new Error(`No balances found for sender with address ${address}`);

  const filtered = balances.filter(balance => balance.currency.ct === currency.ct && balance.currency.id === currency.id);

  if (filtered.length === 1)
    return filtered[0];
  else if (filtered.length < 1)
    throw new Error(`No balances found for sender with currency { ct:${currency.ct}, id: ${currency.id} }`);
  else
    throw new Error(`Unexpected extra balances found for sender with currency { ct:${currency.ct}, id: ${currency.id} }`);
}
*/
async function getDriipSettlementDisputeProof(senderReceipts, initiatorReceipt, stagedAmount) {

  const lt = (a, b) => bigNumberify(a).lt(bigNumberify(b));

  let runningNonce = initiatorReceipt.sender.nonce;

  for (const proofCandidate of senderReceipts.sort((a, b) => a.nonce - b.nonce)) {
    if (proofCandidate.sender.nonce !== runningNonce)
      throw new Error(`Receipt has wrong nonce. Expected ${runningNonce}, found ${proofCandidate.nonce}`);

    if (lt(proofCandidate.sender.balances.current, stagedAmount))
      return proofCandidate;

    ++runningNonce;
  }

  return null;
}

async function handleDriipSettlement (initiatorAddress, paymentHash, stagedAmount) {

  logger.info(`StartChallengeFromPaymentEvent: initiator ${initiatorAddress}, staged ${stagedAmount}, hash ${paymentHash}`);

  const initiatorReceipt = await getInitiatorReceipt(_wallet.get(this).provider, initiatorAddress, paymentHash);
  const senderReceipts = await getWalletReceipts(_wallet.get(this).provider, initiatorReceipt.sender.wallet);
  const newSenderReceipts = await getNewSenderReceipts(senderReceipts, initiatorReceipt);

  const disputeProof = await getDriipSettlementDisputeProof(newSenderReceipts, initiatorReceipt, stagedAmount.toString());

  if (disputeProof)
    _driipSettlementChallengeContract.get(this).challengeByPayment(initiatorReceipt.sender.wallet, disputeProof);

  const finalReceipt = disputeProof || getLastSenderReceipt(senderReceipts, initiatorReceipt.sender.wallet, initiatorReceipt.currency.ct, initiatorReceipt.currency.id);
  const margin = bigNumberify(finalReceipt.sender.balances.current).sub(stagedAmount).toString();

  logger.info(`    ${disputeProof ? 'Disputed' : 'Approved'} by payment at block ${finalReceipt.blockNumber}`);
  logger.info(`    Sender   : address ${finalReceipt.sender.wallet}, nonce ${finalReceipt.sender.nonce}, balance ${finalReceipt.sender.balances.current}, margin ${margin}`);
  logger.info(`    Recipient: address ${finalReceipt.recipient.wallet}, nonce ${finalReceipt.recipient.nonce}`);

  logger.info(' ');
}

function getLastSenderReceipt (receipts, address, ct, id) {
  if (receipts.length === 0)
    return null;

  const filtered = receipts.filter(receipt =>
    (receipt.sender.wallet.toLowerCase() === address.toLowerCase()) && (receipt.currency.ct === ct) && (receipt.currency.id === id)
  );

  if (filtered.length === 0)
    return null;

  return filtered.sort((a, b) => b.nonce - a.nonce)[0];
}

async function handleNullSettlement (address, stagedAmount, ct, id) {
  logger.info(`StartChallengeEvent: initiator ${address}, staged ${stagedAmount}, ct ${ct}, id ${id}`);

  const senderReceipts = await getWalletReceipts(_wallet.get(this).provider, address);
  const lastReceipt = getLastSenderReceipt(senderReceipts, address, ct, id);
  const margin = bigNumberify(lastReceipt.sender.balances.current).sub(stagedAmount).toString();
  const isDisputable = bigNumberify(margin).lt(0);

  if (isDisputable)
    _nullSettlementChallengeContract.get(this).challengeByPayment(address, lastReceipt);

  logger.info(`    ${isDisputable ? 'Disputed' : 'Approved'} by payment at block ${lastReceipt.blockNumber}`);
  logger.info(`    Sender   : address ${lastReceipt.sender.wallet}, nonce ${lastReceipt.sender.nonce}, balance ${lastReceipt.sender.balances.current}, margin ${margin}`);
  logger.info(`    Recipient: address ${lastReceipt.recipient.wallet}, nonce ${lastReceipt.recipient.nonce}`);

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

  constructor(wallet, driipSettlementChallengeContract, nullSettlementChallengeContract) {
    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _wallet.set(this, wallet);
    _driipSettlementChallengeContract.set(this, driipSettlementChallengeContract);
    _nullSettlementChallengeContract.set(this, nullSettlementChallengeContract);

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


/*
const isNewerReceipt = (initiatorReceipt, senderReceipt) => {
  if (senderReceipt.sender.wallet !== initiatorReceipt.sender.wallet)
    return false;
  if (senderReceipt.sender.nounce <= initiatorReceipt.sender.nounce)
    return false;
  if (senderReceipt.currency.ct !== initiatorReceipt.currency.ct)
    return false;
  if (senderReceipt.currency.id !== initiatorReceipt.currency.id)
    return false;
  return true;
};

async function handleChallenge(initiatorWallet, paymentHash, stagedAmount) {
  const initiatorReceipts = await nahmiiSrv.getWalletReceipts(initiatorWallet);
  const initiatorReceipt = initiatorReceipts.find(receipt => receipt.seals.operator.hash === paymentHash);

  if (!initiatorReceipt)
    throw Error(`Could not find initiator receipt for challenged payment. wallet: ${initiatorWallet}, hash: ${paymentHash}, staged amount: ${stagedAmount}`);

  //const senderBalance = await nahmiiSrv.getNahmiiBalance(initiatorReceipt.sender.wallet, initiatorReceipt.currency.ct);
  const senderReceipts = await nahmiiSrv.getWalletReceipts(initiatorReceipt.sender.wallet);
  const senderReceipt = senderReceipts.find(receipt => receipt.seals.operator.hash === paymentHash);

  if (!senderReceipt)
    throw Error(`Could not find sender receipt for challenged payment. wallet: ${initiatorWallet}, hash: ${paymentHash}, staged amount: ${stagedAmount}`);

  let runningSenderBalance = senderReceipt.sender.balances.previous;
  const newerReceipts = senderReceipts.filter(receipt => isNewerReceipt(initiatorReceipt, receipt));

  let disputeProof;
  let accFees = 0;
  for (const newerReceipt of newerReceipts) {
    runningSenderBalance -= newerReceipt.amount;
    if (runningSenderBalance < stagedAmount) {
      disputeProof = newerReceipts;
      break;
    }
  }

  const verdict = disputeProof ? 'DISPUTED' : 'APPROVED';
  logger.info(`${verdict}: wallet: ${initiatorWallet}, hash: ${paymentHash}, staged amount: ${stagedAmount}`);

}
*/
