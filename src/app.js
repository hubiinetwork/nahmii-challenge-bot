'use strict';

const { logger } = require('@hubiinetwork/logger');
const config = require('./config');
const ClusterInformation = require('./cluster-information');
const ContractFactory = require('./contract-factory');
const ChallengeHandler = require('./challenge-handler');
const NestedError = require('./utils/nested-error');
const nahmii = require('nahmii-sdk');


process.on('unhandledRejection', (reason /*, promise*/) => {
  logger.error(NestedError.asStringified(reason));
  setTimeout(() => process.exit(-1), 2000);
});


(async () => {
  const now = new Date(Date.now()).toISOString();

  logger.info(`\n### ## # NAHMII CHALLENGE BOT STARTED ${now} # ## ###\n`);

  logger.info('Validating config ...');
  config.validateConfig();

  logger.info(`   nahmi URL : '${config.services.baseUrl}'`);
  logger.info(`ethereum URL : '${config.ethereum.nodeUrl}'`);

  const ethereum = await ClusterInformation.getEthereum();

  logger.info(`     network : '${ethereum.net}'`);
  logger.info('');

  const provider = new nahmii.NahmiiProvider(
    config.services.baseUrl,
    config.identity.appId, config.identity.appSecret,
    config.ethereum.nodeUrl, ethereum.net
  );

  logger.info('Attaching event handlers ...');

  const challenge_handler = new ChallengeHandler(
    new nahmii.Wallet(config.wallet.privateKey, provider),
    await ContractFactory.create('DriipSettlementChallenge', provider),
    await ContractFactory.create('NullSettlementChallenge', provider)
  );

  challenge_handler.onStartChallengeFromPaymentEvent((initiatorWallet, paymentHash, stagedAmount) =>
    logger.info(`wallet: ${initiatorWallet}, hash: ${paymentHash}, staged amount: ${stagedAmount}`)
  );

  challenge_handler.onStartChallengeEvent((initiatorWallet, stagedAmount, ct, id) =>
    logger.info(`wallet: ${initiatorWallet}, staged amount: ${stagedAmount}, ct: ${ct}, id: ${id}`)
  );

  logger.info('Waiting for events ...');

})();