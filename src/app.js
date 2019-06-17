'use strict';

const { logger } = require('@hubiinetwork/logger');
const nahmii = require('nahmii-sdk');
const keythereum = require('keythereum');
const path = require('path');
const ethers = require('ethers');

const config = require('./config');
const ClusterInformation = require('./cluster-information');
const NestedError = require('./utils/nested-error');
const NahmiiProviderFactory = require('./nahmii-provider-factory');
const ChallengeHandlerFactory = require('./challenge-handler/challenge-handler-factory');
const metrics = require('./metrics');
const http = require('http');

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

  if (! config.isValid())
    throw new Error(`Config is not valid. ${config.getValidationStr()}`);

  logger.info('');
  logger.info(`   nahmi URL : '${config.services.baseUrl}'`);
  logger.info(`ethereum URL : '${config.ethereum.nodeUrl}'`);
  logger.info(` wallet addr : '${config.wallet.utcAddress}'`);

  const ethereum = await ClusterInformation.acquireEthereum();

  logger.info(`     network : '${ethereum.net}'`);
  logger.info('');

  const provider = await NahmiiProviderFactory.acquireProvider();

  logger.info('Reading utc keystore ...');

  const keyObject = keythereum.importFromFile(config.wallet.utcAddress, path.resolve(__dirname, '../'));
  const privateKey = keythereum.recover(config.wallet.utcSecret, keyObject).toString('hex');

  logger.info('Creating challenge handler ...');

  const wallet = new nahmii.Wallet(privateKey, provider);

  const challengeHandler = ChallengeHandlerFactory.create(
    wallet, ethers.utils.bigNumberify(config.ethereum.gasLimit)
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