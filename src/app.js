'use strict';

const ethers = require('ethers');
const { logger } = require('@hubiinetwork/logger');
const nahmiiSrv = require('./nahmii-service');
const currencySrv = require('./currency-service');
const configSrv = require('./config-service/nahmii-config');


const DriipSettlementChallenge = {
  address: '0xf88aa13327385931e56410f97f8cd631f95216e4',
  abi: [
    'event StartChallengeFromPaymentEvent(address wallet, bytes32 paymentHash, int256 stageAmount)',
    'event StartChallengeFromPaymentByProxyEvent(address proxy, address wallet, bytes32 paymentHash, int256 stageAmount)'
  ]
};

async function challenegePayment(wallet, paymentHash, stageAmount) {
  const currencies = await currencySrv.acquireCurrencies();
  const balance = await nahmiiSrv.getBalance(wallet, currencies.nii.currency);
  const receipts = await nahmiiSrv.getReceipts(wallet);
  console.log('');
}

(async () => {
  const ethPrv = ethers.getDefaultProvider('ropsten');
  const contract = new ethers.Contract(DriipSettlementChallenge.address, DriipSettlementChallenge.abi, ethPrv);
  contract.on('StartChallengeFromPaymentEvent', (wallet, paymentHash, stageAmount) => {
    challenegePayment('0x'+wallet, paymentHash, stageAmount);
  });
  contract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, wallet, paymentHash, stageAmount) => {
    challenegePayment(wallet, paymentHash, stageAmount);
  });
  logger.info(`\n\n### ## # STARTED ${new Date(Date.now()).toISOString()} # ## ###`);

  const paymentHash = '0x0';
  const stageAmount = '0';
  challenegePayment('0x9dcb8899faab804527b9540d203b1ab778641554', paymentHash, stageAmount);
})();