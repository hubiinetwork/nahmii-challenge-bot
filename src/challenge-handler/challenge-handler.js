'use strict';

const nahmii = require('nahmii-sdk');

const _wallet = new WeakMap;
const _onStartChallengeEventFromPaymentCallback = new WeakMap;
const _onStartChallengeEventCallback = new WeakMap;
const _driipSettlementChallengeContract = new WeakMap;
const _nullSettlementChallengeContract= new WeakMap;


class ChallengeHandler {

  constructor(wallet, driipSettlementChallengeContract, nullSettlementChallengeContract) {
    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _wallet.set(this, wallet);
    _driipSettlementChallengeContract.set(this, driipSettlementChallengeContract);
    _nullSettlementChallengeContract.set(this, nullSettlementChallengeContract);

    driipSettlementChallengeContract.on('StartChallengeFromPaymentEvent', (initiatorWallet, paymentHash, stagedAmount) => {
      this.handleStartChallengeFromPaymentEvent(initiatorWallet, paymentHash, stagedAmount);
    });

    driipSettlementChallengeContract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
      this.handleStartChallengeFromPaymentEvent(initiatorWallet, paymentHash, stagedAmount);
    });

    nullSettlementChallengeContract.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
      this.handleStartChallengeEvent(initiatorWallet, stagedAmount, stagedCt, stageId);
    });

    nullSettlementChallengeContract.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
      this.handleStartChallengeEvent(initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  }

  handleStartChallengeFromPaymentEvent (initiatorWallet, paymentHash, stagedAmount) {
    if (_onStartChallengeEventFromPaymentCallback.get(this))
      _onStartChallengeEventFromPaymentCallback.get(this)(initiatorWallet, paymentHash, stagedAmount);
  }

  handleStartChallengeEvent (initiatorWallet, stagedAmount, ct, id) {
    if (_onStartChallengeEventCallback.get(this))
      _onStartChallengeEventCallback.get(this)(initiatorWallet, stagedAmount, ct, id);
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
