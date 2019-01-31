'use strict';

const ethers = require('ethers');
const { logger } = require('@hubiinetwork/logger');
const nahmiiSrv = require('./nahmii-service');
const currencySrv = require('./currency-service');
const configSrv = require('./config-service/nahmii-config');
const BigNumber = require('bignumber.js');


const DriipSettlementChallenge = {
  address: '0xf88aa13327385931e56410f97f8cd631f95216e4',
  abi: [
    'event StartChallengeFromPaymentEvent(address wallet, bytes32 paymentHash, int256 stageAmount)',
    'event StartChallengeFromPaymentByProxyEvent(address proxy, address wallet, bytes32 paymentHash, int256 stageAmount)'
  ]
};

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

(async () => {
  const ethPrv = ethers.getDefaultProvider('ropsten');
  const contract = new ethers.Contract(DriipSettlementChallenge.address, DriipSettlementChallenge.abi, ethPrv);
  contract.on('StartChallengeFromPaymentEvent', (wallet, paymentHash, stageAmount) => {
    handleChallenge('0x'+wallet, paymentHash, stageAmount);
  });
  contract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, wallet, paymentHash, stageAmount) => {
    handleChallenge(wallet, paymentHash, stageAmount);
  });

  const url = (await configSrv.acquireNahmiiConfig()).apiRoot;
  const now = new Date(Date.now()).toISOString();
  logger.info(`\n### ## # STARTED ${url} ${now} # ## ###\n`);

  const initiator = '0xc16146efa43185716d217b4c29c4aca5ff89e9a7';
  const paymentHash = '0x1adfacfb11806dae626d4cb8d62764187cb70c588c925591d00bac46c02a08b5';
  const stageAmount = '0';
  handleChallenge(initiator, paymentHash, stageAmount);
})();