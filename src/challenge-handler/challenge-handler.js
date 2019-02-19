'use strict';
/*
const nahmiiSrv = require('./nahmii-service');
const currencySrv = require('./currency-service');
const configSrv = require('./config-service/nahmii-config');
const BigNumber = require('bignumber.js');
*/

const { logger } = require('@hubiinetwork/logger');

class ChallengeHandler {

  static handleDriipSettlementChallenge (initiatorWallet, paymentHash, stagedAmount) {
    logger.info(`wallet: ${initiatorWallet}, hash: ${paymentHash}, staged amount: ${stagedAmount}`);
  }

  static handleNullSettlementChallenge (initiatorWallet, stagedAmount, ct, id) {
    logger.info(`wallet: ${initiatorWallet}, staged amount: ${stagedAmount}, ct: ${ct}, id: ${id}`);
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
