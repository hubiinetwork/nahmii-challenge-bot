
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
    const toBlock = await provider.getBlock(await provider.getBlockNumber());
    const block0 = await provider.getBlock(0);
    const startTimestamp = Math.max(toBlock.timestamp - walletLockTimeout, block0.timestamp);

    const fromBlock = BinaryBlockSearcher.findBlockLte(block => block.timestamp - startTimestamp, block0, toBlock);
    const catchupConfirmationsDepth = toBlock.number - fromBlock.number - 1;

    return catchupConfirmationsDepth;
  }

  static async create () {
    const catchupConfirmationsDepth = await EventGeneratorFactory.getCatchupConfirmationsDepth();
    const eventGenerator = new EventGenerator(100, 1000, catchupConfirmationsDepth, config.services.confirmationsDepth);
    return eventGenerator;
  }
}

module.exports = EventGeneratorFactory;