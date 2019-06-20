'use strict';

const ChallengeHandler = require('../challenge-handler');
const contracts = require('../contract-repository');
const NestedError = require('../../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');

async function create (wallet, gasLimit) {
  const handler = new ChallengeHandler(wallet, gasLimit);

  try {
    logger.info(`Listen to 'DriipSettlementChallengeByPayment.StartChallengeFromPaymentEvent', '${(await contracts.getDriipSettlementChallengeByPayment()).address}'`);
    (await contracts.getDriipSettlementChallengeByPayment()).on('StartChallengeFromPaymentEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id) => {
      logger.info('Received DriipSettlementChallengeByPayment.StartChallengeFromPaymentEvent');
      handler.handleDSCStart(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    logger.info(`Listen to 'DriipSettlementChallengeByPayment.StartChallengeFromPaymentByProxyEvent', '${(await contracts.getDriipSettlementChallengeByPayment()).address}'`);
    (await contracts.getDriipSettlementChallengeByPayment()).on('StartChallengeFromPaymentByProxyEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      logger.info('Received DriipSettlementChallengeByPayment.StartChallengeFromPaymentByProxyEvent');
      handler.handleDSCStart(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    logger.info(`Listen to 'DriipSettlementChallengeByPayment.ChallengeByPaymentEvent', '${(await contracts.getDriipSettlementChallengeByPayment()).address}'`);
    (await contracts.getDriipSettlementChallengeByPayment()).on('ChallengeByPaymentEvent', (challengedWallet, nonce, _cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      logger.info('Received DriipSettlementChallengeByPayment.ChallengeByPaymentEvent');
      handler.handleWalletLocked('DSC Locked', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    logger.info(`Listen to 'NullSettlementChallengeByPayment.StartChallengeEvent', '${(await contracts.getNullSettlementChallengeByPayment()).address}'`);
    (await contracts.getNullSettlementChallengeByPayment()).on('StartChallengeEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id) => {
      logger.info('Received NullSettlementChallengeByPayment.StartChallengeEvent');
      handler.handleNSCStart(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    logger.info(`Listen to 'NullSettlementChallengeByPayment.StartChallengeByProxyEvent', '${(await contracts.getNullSettlementChallengeByPayment()).address}'`);
    (await contracts.getNullSettlementChallengeByPayment()).on('StartChallengeByProxyEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      logger.info('Received NullSettlementChallengeByPayment.StartChallengeByProxyEvent');
      handler.handleNSCStart(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    logger.info(`Listen to 'NullSettlementChallengeByPayment.ChallengeByPaymentEvent', '${(await contracts.getNullSettlementChallengeByPayment()).address}'`);
    (await contracts.getNullSettlementChallengeByPayment()).on('ChallengeByPaymentEvent', (challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      logger.info('Received NullSettlementChallengeByPayment.ChallengeByPaymentEvent');
      handler.handleWalletLocked('NSC Locked', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    logger.info(`Listen to 'ClientFund.SeizeBalancesEvent', '${(await contracts.getClientFund()).address}'`);
    (await contracts.getClientFund()).on('SeizeBalancesEvent', (seizedWallet, seizerWallet, value, ct, id) => {
      logger.info('Received ClientFund.SeizeBalancesEvent');
      handler.handleBalancesSeized(seizedWallet, seizerWallet, value, ct, id);
    });
  }
  catch (err) {
    throw new NestedError (err, 'Failed to initialize contract event handlers. ' + err.message);
  }

  return handler;
}

module.exports = {
  create
};
