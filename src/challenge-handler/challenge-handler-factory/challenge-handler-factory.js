'use strict';

const { logger } = require('@hubiinetwork/logger');

const ChallengeHandler = require('../challenge-handler');
const contracts = require('../../contract-repository');
const NestedError = require('../../utils/nested-error');
const EventGenerator = require('../../event-generator');
const config = require('../../config');

const _eventGenerator = new EventGenerator();
_eventGenerator.config.confirmationsDepth = config.services.confirmationsDepth;

async function create (wallet, gasLimit) {
  const handler = new ChallengeHandler(wallet, gasLimit);
  const topics = [];

  try {

    const subscribe = async (eventTag, callback) => {
      const [ contractName, eventName ] = eventTag.split('.');
      const contract = await contracts.acquireContract(contractName);

      topics.push(contract.interface.events[eventName].topic);

      _eventGenerator.on(eventTag, async (blockNo, ...args) => {
        logger.info(' ');
        logger.info(`${(new Date()).toISOString()} ${blockNo} ${eventTag}`);
        await callback(...args);
      });
    };

    await subscribe('DriipSettlementChallengeByPayment.StartChallengeFromPaymentEvent', async (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id) => {
      await handler.handleDSCStart(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    await subscribe('DriipSettlementChallengeByPayment.StartChallengeFromPaymentByProxyEvent', async (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      await handler.handleDSCStart(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    await subscribe('DriipSettlementChallengeByPayment.ChallengeByPaymentEvent', async (challengedWallet, nonce, _cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      await handler.handleWalletLocked('DSC Locked', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    await subscribe('NullSettlementChallengeByPayment.StartChallengeEvent', async (wallet, nonce, stageAmount, targetBalanceAmount, ct, id) => {
      await handler.handleNSCStart(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    await subscribe('NullSettlementChallengeByPayment.StartChallengeByProxyEvent', async (wallet, nonce, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      await handler.handleNSCStart(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    await subscribe('NullSettlementChallengeByPayment.ChallengeByPaymentEvent', async (challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      await handler.handleWalletLocked('NSC Locked', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    await subscribe('ClientFund.SeizeBalancesEvent', async (seizedWallet, seizerWallet, value, ct, id) => {
      await handler.handleBalancesSeized(seizedWallet, seizerWallet, value, ct, id);
    });

    _eventGenerator.runWhile([topics], () => true);
  }
  catch (err) {
    throw new NestedError (err, 'Failed to initialize contract event handlers. ' + err.message);
  }

  return handler;
}

module.exports = {
  create
};
