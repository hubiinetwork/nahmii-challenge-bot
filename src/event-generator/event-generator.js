'use strict';

const EventEmitter = require('events');
const { logger } = require('@hubiinetwork/logger');

const contractRepository = require('../contract-repository');
const providerFactory = require('../nahmii-provider-factory');
const NestedError = require('../utils/nested-error');

// EventGeneratorConfig
const _blockPullDelayMs = new WeakMap();
const _confirmationsDepth = new WeakMap();

class EventGeneratorConfig {
  constructor () {
    _blockPullDelayMs.set(this, 1000);
    _confirmationsDepth.set(this, 12);
    Object.seal(this);
  }

  get blockPullDelayMs () {
    return _blockPullDelayMs.get(this);
  }

  set blockPullDelayMs (delayMs) {
    _blockPullDelayMs.set(this, delayMs);
  }

  get confirmationsDepth () {
    return _confirmationsDepth.get(this);
  }

  set confirmationsDepth (depth) {
    _confirmationsDepth.set(this, depth);
  }
}

// EventGenerator state
const _isStarted = new WeakMap();
const _config = new WeakMap();

class EventGenerator extends EventEmitter {
  constructor () {
    super();
    _isStarted.set(this, false);
    _config.set(this, new EventGeneratorConfig());
  }

  // properties

  get isStarted () {
    return _isStarted.get(this);
  }

  get config () {
    return _config.get(this);
  }

  // generators

  async * genEstimatedConfirmationDepth () {
  /*
    const provider = await providerFactory.acquireProvider();
    const configContract = await contractRepository.acquireContract('Configuration');
    const challengeTimeoutSec = (await configContract.settlementChallengeTimeout()).toString();
    const blockWindowSize = 10;

    let oldEstimatedConfirmationDepth;

    while (true) {
      const latestBlockNo = await provider.getBlockNumber();
      const blockTimestampSec0 = (await provider.getBlock(Math.max(latestBlockNo - blockWindowSize, 0))).timestamp;
      const blockTimestampSecLatest = (await provider.getBlock(latestBlockNo)).timestamp;
      const avgSecPrBlock = Math.trunc((blockTimestampSecLatest - blockTimestampSec0) / Math.max(blockWindowSize, 1));
      const timeoutMarginFactor = 0.5;
      const maxConfirmationDepth = Math.trunc(timeoutMarginFactor * challengeTimeoutSec / avgSecPrBlock);
      const estimatedConfirmationDepth = Math.min(maxConfirmationDepth, this.config.confirmationsDepth());

      yield estimatedConfirmationDepth;

      if (oldEstimatedConfirmationDepth !== estimatedConfirmationDepth) {
        logger.info(`Confirmation depth: configured ${this.config.confirmationsDepth()},  estimated ${estimatedConfirmationDepth}`);
        oldEstimatedConfirmationDepth = estimatedConfirmationDepth;
      }
    }
  */
    const confirmationsDepth = this.config.confirmationsDepth;

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 0)); // Avoids heap exhaustion
      yield confirmationsDepth;
    }
  }

  async * genLatestConfirmedBlockNumbers () {
    try {
      const provider = await providerFactory.acquireProvider();

      for await (const estimatedConfirmationDepth of this.genEstimatedConfirmationDepth()) {
        const latestBlockNo = await new Promise(resolve => provider.once('block', resolve));
        const latestConfirmedBlockNo = Math.max(latestBlockNo - estimatedConfirmationDepth, 0);

        logger.info(`Block ${latestConfirmedBlockNo} (${latestBlockNo})`);

        yield latestConfirmedBlockNo;
      }
    }
    catch (err) {
      throw new NestedError(err, 'Failed to generate block number. ' + err.message);
    }
  }

  /**
   * Generate latest block numbers in strictly increasing order of step 1
   */
  async * genSequenceOfLatestConfirmedBlockNumbers() {
    let oldConfirmedBlockNo;

    for await (const confirmedBlockNo of this.genLatestConfirmedBlockNumbers()) {
      const startBlockNo = oldConfirmedBlockNo === undefined ? confirmedBlockNo : oldConfirmedBlockNo + 1;
      for (let i = startBlockNo; i <= confirmedBlockNo; ++i)
        yield i;

      oldConfirmedBlockNo = confirmedBlockNo;
    }
  }

  async * genLatestConfirmedLogs(topics) {
    const provider = await providerFactory.acquireProvider();

    for await (const blockNo of this.genSequenceOfLatestConfirmedBlockNumbers()) {
      const logs = await provider.getLogs({ fromBlock: blockNo, toBlock: blockNo, topics });

      for (const log of logs)
        yield log;
    }
  }

  async * genPseudoEvents(topics) {
    for await (const log of this.genLatestConfirmedLogs(topics)) {
      const contract = contractRepository.tryGetContractFromAddress(log.address);

      if (!contract) {
        logger.info('Event generator could not find contract with address: ' + contract.address);
        continue;
      }

      const parsedLog = contract.interface.parseLog(log);
      const eventArgs = [];

      for (let i = 0; parsedLog.values[i]; ++i)
        eventArgs.push(parsedLog.values[i]);

      const event = Object.values(contract.interface.events).find(event => event.topic === log.topics[0]);
      const eventTag = contract.name + '.' + event.name;

      yield { blockNo: log.blockNumber, eventTag, eventArgs };
    }
  }

  // action

  async runWhile (topics, shouldRunCB) {
    if (_isStarted.get(this))
      throw new Error('Cannot start event generator that is already started');
    else
      _isStarted.set(this, true);

    const pseudoEventsItr = this.genPseudoEvents(topics);

    while (shouldRunCB()) {
      const { blockNo, eventTag, eventArgs } = (await pseudoEventsItr.next()).value;
      this.emit(eventTag, blockNo, ...eventArgs);
    }

    _isStarted.set(this, false);
  }
}

module.exports = EventGenerator;
