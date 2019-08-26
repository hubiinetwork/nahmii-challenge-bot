'use strict';

const { logger } = require('@hubiinetwork/logger');

const ChallengeHandler = require('../challenge-handler');
const contracts = require('../../contract-repository');
const NestedError = require('../../utils/nested-error');
const EventGeneratorFactory = require('../../event-generator-factory');


async function create (wallet, gasLimit) {
  const eventGenerator = await EventGeneratorFactory.create();
  const handler = new ChallengeHandler(wallet, gasLimit);
  const topics = [];

  try {

    const subscribe = async (eventTag, callback) => {
      const [ contractName, eventName ] = eventTag.split('.');
      const contract = await contracts.acquireContract(contractName);

      topics.push(contract.interface.events[eventName].topic);

      eventGenerator.on(eventTag, async (blockNo, ...args) => {
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

    eventGenerator.runWhile([topics], () => true);
  }
  catch (err) {
    throw new NestedError (err, 'Failed to initialize contract event handlers. ' + err.message);
  }

  return handler;
}

module.exports = {
  create
};
