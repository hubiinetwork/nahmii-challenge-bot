'use strict';

const { logger } = require('@hubiinetwork/logger');

const t = require('../../runtime-types');
const ChallengeHandler = require('../challenge-handler');
const contracts = require('../../contract-repository');
const NestedError = require('../../utils/nested-error');
const EventGeneratorFactory = require('../../event-generator-factory');
const { EthereumAddress } = require('nahmii-ethereum-address');


async function create (challenger, gasLimit) {
  t.NahmiiWallet().assert(challenger);

  const eventGenerator = await EventGeneratorFactory.create();
  const handler = new ChallengeHandler(challenger, gasLimit);
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

    await subscribe('DriipSettlementChallengeByPayment.StartChallengeFromPaymentEvent', async (initiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id) => {
      t.AddressString().assert(initiator);
      t.EthersBigNumber().assert(nonce);
      t.EthersBigNumber().assert(cumulativeTransferAmount);
      t.EthersBigNumber().assert(stageAmount);
      t.EthersBigNumber().assert(targetBalanceAmount);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethCt = EthereumAddress.from(ct);

      await handler.handleDSCStart(ethInitiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ethCt, id);
    });

    await subscribe('DriipSettlementChallengeByPayment.StartChallengeFromPaymentByProxyEvent', async (initiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      t.AddressString().assert(initiator);
      t.EthersBigNumber().assert(nonce);
      t.EthersBigNumber().assert(cumulativeTransferAmount);
      t.EthersBigNumber().assert(stageAmount);
      t.EthersBigNumber().assert(targetBalanceAmount);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethCt = EthereumAddress.from(ct);

      await handler.handleDSCStart(ethInitiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ethCt, id);
    });

    await subscribe('DriipSettlementChallengeByPayment.ChallengeByPaymentEvent', async (initiator, nonce, _cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, challenger) => {
      t.AddressString().assert(initiator);
      t.EthersBigNumber().assert(nonce);
      t.EthersBigNumber().assert(stageAmount);
      t.EthersBigNumber().assert(targetBalanceAmount);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);
      t.AddressString().assert(challenger);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethCt = EthereumAddress.from(ct);
      const ethChallenger = EthereumAddress.from(challenger);

      await handler.handleWalletLocked('DSC Locked', ethInitiator, nonce, stageAmount, targetBalanceAmount, ethCt, id, ethChallenger);
    });

    await subscribe('NullSettlementChallengeByPayment.StartChallengeEvent', async (initiator, nonce, stageAmount, targetBalanceAmount, ct, id) => {
      t.AddressString().assert(initiator);
      t.EthersBigNumber().assert(nonce);
      t.EthersBigNumber().assert(stageAmount);
      t.EthersBigNumber().assert(targetBalanceAmount);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethCt = EthereumAddress.from(ct);

      await handler.handleNSCStart(ethInitiator, nonce, stageAmount, targetBalanceAmount, ethCt, id);
    });

    await subscribe('NullSettlementChallengeByPayment.StartChallengeByProxyEvent', async (initiator, nonce, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      t.AddressString().assert(initiator);
      t.EthersBigNumber().assert(nonce);
      t.EthersBigNumber().assert(stageAmount);
      t.EthersBigNumber().assert(targetBalanceAmount);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethCt = EthereumAddress.from(ct);

      await handler.handleNSCStart(ethInitiator, nonce, stageAmount, targetBalanceAmount, ethCt, id);
    });

    await subscribe('NullSettlementChallengeByPayment.ChallengeByPaymentEvent', async (initiator, nonce, stageAmount, targetBalanceAmount, ct, id, challenger) => {
      t.AddressString().assert(initiator);
      t.EthersBigNumber().assert(nonce);
      t.EthersBigNumber().assert(stageAmount);
      t.EthersBigNumber().assert(targetBalanceAmount);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);
      t.AddressString().assert(challenger);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethCt = EthereumAddress.from(ct);
      const ethChallenger = EthereumAddress.from(challenger);

      await handler.handleWalletLocked('NSC Locked', ethInitiator, nonce, stageAmount, targetBalanceAmount, ethCt, id, ethChallenger);
    });

    await subscribe('ClientFund.SeizeBalancesEvent', async (initiator, challenger, value, ct, id) => {
      t.AddressString().assert(initiator);
      t.AddressString().assert(challenger);
      t.AddressString().assert(ct);
      t.EthersBigNumber().assert(id);

      const ethInitiator = EthereumAddress.from(initiator);
      const ethChallenger = EthereumAddress.from(challenger);
      const ethCt = EthereumAddress.from(ct);

      await handler.handleBalancesSeized(ethInitiator, ethChallenger, value, ethCt, id);
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
