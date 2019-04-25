'use strict';

const { logger } = require('@hubiinetwork/logger');
const nahmii = require('nahmii-sdk');
const keythereum = require('keythereum');
const path = require('path');
const ethers = require('ethers');
const http = require('http');

const config = require('./config');
const ClusterInformation = require('./cluster-information');
const ContractFactory = require('./contract-factory');
const ChallengeHandler = require('./challenge-handler');
const NestedError = require('./utils/nested-error');
const metrics = require('./metrics');

process.on('unhandledRejection', (reason /*, promise*/) => {
  logger.error(NestedError.asStringified(reason));
  setTimeout(() => process.exit(-1), 2000);
});

async function registerEthBalance (wallet) {
  try {
    const balance = await wallet.getBalance();
    metrics.registerEthBalanceBN(balance);
  }
  catch (err) {
    throw new NestedError(err, 'Failed to register ETH balance metric');
  }
}

(async () => {
  const now = new Date(Date.now()).toISOString();

  logger.info(`\n### ## # NAHMII CHALLENGE BOT STARTED ${now} # ## ###\n`);

  logger.info('Validating config ...');
  config.validateConfig();

  logger.info('');
  logger.info(`   nahmi URL : '${config.services.baseUrl}'`);
  logger.info(`ethereum URL : '${config.ethereum.nodeUrl}'`);
  logger.info(` wallet addr : '${config.wallet.utcAddress}'`);

  const ethereum = await ClusterInformation.acquireEthereum();

  logger.info(`     network : '${ethereum.net}'`);
  logger.info('');

  const provider = new nahmii.NahmiiProvider(
    config.services.baseUrl,
    config.identity.appId, config.identity.appSecret,
    config.ethereum.nodeUrl, ethereum.net
  );

  logger.info('Reading utc keystore ...');

  const keyObject = keythereum.importFromFile(config.wallet.utcAddress, path.resolve(__dirname, '../'));
  const privateKey = keythereum.recover(config.wallet.utcSecret, keyObject).toString('hex');

  logger.info('Creating challenge handler ...');

  const wallet = new nahmii.Wallet(privateKey, provider);

  const challengeHandler = new ChallengeHandler(
    wallet,
    ethers.utils.bigNumberify(config.ethereum.gasLimit),
    await ContractFactory.create('ClientFund', provider),
    await ContractFactory.create('DriipSettlementChallengeByPayment', provider),
    await ContractFactory.create('NullSettlementChallengeByPayment', provider),
    await ContractFactory.create('BalanceTracker', provider),
    await ContractFactory.create('DriipSettlementDisputeByPayment', provider),
    await ContractFactory.create('NullSettlementDisputeByPayment', provider)
  );

  const metricsServer = http.createServer(metrics.app);
  metricsServer.listen(config.metricsPort);
  metricsServer.on('listening', () => {
    console.log(`Metrics available on http://localhost:${config.metricsPort}/metrics`);
  });

  metrics.initProgressCounter();

  challengeHandler.onBalancesSeized(() => {
    metrics.registerDscStarted();
    registerEthBalance(wallet);
  });

  challengeHandler.onBalancesSeized(() => {
    metrics.registerDscAgreed();
    registerEthBalance(wallet);
  });

  challengeHandler.onBalancesSeized(() => {
    metrics.registerDscDisputed();
    registerEthBalance(wallet);
  });

  challengeHandler.onBalancesSeized(() => {
    metrics.registerNscStarted();
    registerEthBalance(wallet);
  });

  challengeHandler.onBalancesSeized(() => {
    metrics.registerNscAgreed();
    registerEthBalance(wallet);
  });

  challengeHandler.onBalancesSeized(() => {
    metrics.registerNscDisputed();
    registerEthBalance(wallet);
  });

  challengeHandler.onBalancesSeized(() => {
    metrics.registerBalancesSeized();
    registerEthBalance(wallet);
  });

  logger.info('');
  logger.info('We are in business! Waiting for events ...');

})();