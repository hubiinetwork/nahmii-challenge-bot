'use strict';

const { logger } = require('@hubiinetwork/logger');
const nahmii = require('nahmii-sdk');
const keythereum = require('keythereum');
const path = require('path');
const ethers = require('ethers');

const config = require('./config');
const ClusterInformation = require('./cluster-information');
const ContractFactory = require('./contract-factory');
const ChallengeHandler = require('./challenge-handler');
const NestedError = require('./utils/nested-error');
const NahmiiProviderFactory = require('./nahmii-provider-factory');
const ChallengeHandlerFactory = require('./challenge-handler/challenge-handler-factory');

process.on('unhandledRejection', (reason /*, promise*/) => {
  logger.error(NestedError.asStringified(reason));
  setTimeout(() => process.exit(-1), 2000);
});

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

  const provider = await NahmiiProviderFactory.acquireProvider();

  logger.info('Reading utc keystore ...');

  const keyObject = keythereum.importFromFile(config.wallet.utcAddress, path.resolve(__dirname, '../'));
  const privateKey = keythereum.recover(config.wallet.utcSecret, keyObject).toString('hex');

  logger.info('Creating challenge handler ...');

  const challengeHandler = ChallengeHandlerFactory.create(
    new nahmii.Wallet(privateKey, provider),
    ethers.utils.bigNumberify(config.ethereum.gasLimit)
  );

  logger.info('');
  logger.info('We are in business! Waiting for events ...');

})();