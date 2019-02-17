'use strict';

const { logger } = require('@hubiinetwork/logger');
const config = require('./config');
const ClusterInformation = require('./cluster-information');
const ContractFactory = require('./contract-factory');
const ChallengeHandler = require('./challenge-handler');

(async () => {
  const now = new Date(Date.now()).toISOString();

  logger.info(`\n### ## # NAHMII CHALLENGE BOT STARTED ${now} # ## ###\n`);
  logger.info('   nahmi URL : ' + config.services.baseUrl);
  logger.info('ethereum URL : ' + await ClusterInformation.aquireEthereumUrl());
  logger.info('');

  logger.info('Validating config ...');

  config.validateConfig();

  logger.info('Attaching event handlers ...');

  const driipSettlementChallengeContract = await ContractFactory.create('DriipSettlementChallenge');
  const nullSettlementChallengeContract = await ContractFactory.create('NullSettlementChallenge');

  driipSettlementChallengeContract.on('StartChallengeFromPaymentEvent', (initiatorWallet, paymentHash, stagedAmount) => {
    ChallengeHandler.handleDriipSettlementChallenge('0x' + initiatorWallet, paymentHash, stagedAmount);
  });

  driipSettlementChallengeContract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
    ChallengeHandler.handleDriipSettlementChallenge('0x' + initiatorWallet, paymentHash, stagedAmount);
  });

  nullSettlementChallengeContract.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
    ChallengeHandler.handleNullSettlementChallenge('0x' + initiatorWallet, stagedAmount, stagedCt, stageId);
  });

  nullSettlementChallengeContract.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
    ChallengeHandler.handleNullSettlementChallenge('0x' + initiatorWallet, stagedAmount, stagedCt, stageId);
  });

  logger.info('Waiting for events ...');

})();