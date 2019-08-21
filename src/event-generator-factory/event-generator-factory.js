
'use strict';

const contracts = require('../contract-repository');
const providerFactory = require('../nahmii-provider-factory');
const config = require('../config');
const EventGenerator = require('../event-generator');
const BinaryBlockSearcher = require('./binary-block-searcher');

class EventGeneratorFactory {

  static async getCatchupConfirmationsDepth () {
    const configContract = await contracts.acquireContract('Configuration');
    const walletLockTimeout = (await configContract.walletLockTimeout()).toString();

    const provider = await providerFactory.acquireProvider();
    const fromBlock = await provider.getBlock(0);
    const toBlock = await provider.getBlock(await provider.getBlockNumber());
    const startTimestamp = Math.max(toBlock.timestamp - walletLockTimeout, fromBlock.timestamp);

    const lte = block => block.timestamp - startTimestamp;

    const firstCatchupBlock = await BinaryBlockSearcher.findBlockLte(lte, fromBlock.number, toBlock.number);
    const catchupConfirmationsDepth = toBlock.number - firstCatchupBlock.number;

    return catchupConfirmationsDepth;
  }

  static async create () {
    const catchupConfirmationsDepth = await EventGeneratorFactory.getCatchupConfirmationsDepth();
    const eventGenerator = new EventGenerator(100, 1000, catchupConfirmationsDepth, config.services.confirmationsDepth);
    return eventGenerator;
  }
}

module.exports = EventGeneratorFactory;