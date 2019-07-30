'use strict';

const EventEmitter = require('events');
const { logger } = require('@hubiinetwork/logger');

const contractRepository = require('../contract-repository');
const providerFactory = require('../nahmii-provider-factory');
const NestedError = require('../utils/nested-error');

// EventGeneratorConfig
const _blockPullDelayMs = new WeakMap();
const _maxBlockQueryRange = new WeakMap();
const _startConfirmationsDepth = new WeakMap();
const _generalConfirmationsDepth = new WeakMap();

class EventGeneratorConfig {
  constructor (blockPullDelayMs, maxBlockQueryRange, startConfirmationsDepth, generalConfirmationsDepth) {
    if (!Number.isInteger(blockPullDelayMs))
      throw new TypeError('blockPullDelayMs is not an integer');

    if (!Number.isInteger(maxBlockQueryRange))
      throw new TypeError('maxBlockQueryRange is not an integer');

    if (!Number.isInteger(startConfirmationsDepth))
      throw new TypeError('startConfirmationsDepth is not an integer');

    if (!Number.isInteger(generalConfirmationsDepth))
      throw new TypeError('generalConfirmationsDepth is not an integer');

    _blockPullDelayMs.set(this, blockPullDelayMs);
    _maxBlockQueryRange.set(this, maxBlockQueryRange);
    _startConfirmationsDepth.set(this, startConfirmationsDepth);
    _generalConfirmationsDepth.set(this, generalConfirmationsDepth);
    Object.seal(this);
  }

  get blockPullDelayMs () {
    return _blockPullDelayMs.get(this);
  }

  get maxBlockQueryRange () {
    return _maxBlockQueryRange.get(this);
  }

  get startConfirmationsDepth () {
    return _startConfirmationsDepth.get(this);
  }

  get generalConfirmationsDepth () {
    return _generalConfirmationsDepth.get(this);
  }
}

// EventGenerator state
const _isStarted = new WeakMap();
const _config = new WeakMap();

class EventGenerator extends EventEmitter {
  constructor (blockPullDelayMs, maxBlockQueryRange, startConfirmationsDepth, generalConfirmationsDepth) {
    super();
    _isStarted.set(this, false);
    _config.set(this, new EventGeneratorConfig(blockPullDelayMs, maxBlockQueryRange, startConfirmationsDepth, generalConfirmationsDepth));
  }

  // properties

  get config () {
    return _config.get(this);
  }

  // generators

  async * genLatestConfirmedBlockNumbers () {
    try {
      const provider = await providerFactory.acquireProvider();

      const getConfirmedBlockNumber = (latestBlockNo, confirmationsDepth) => {
        const latestConfirmedBlockNo = Math.max(latestBlockNo - confirmationsDepth, 0);
        logger.info(`Block ${latestConfirmedBlockNo} (${latestBlockNo})`);
        return latestConfirmedBlockNo;
      };

      yield getConfirmedBlockNumber(await provider.getBlockNumber(), this.config.startConfirmationsDepth);

      logger.info('CATCHUP STARTED');

      if (this.config.startConfirmationsDepth !== this.config.generalConfirmationsDepth)
        yield getConfirmedBlockNumber(await provider.getBlockNumber(), this.config.generalConfirmationsDepth);

      logger.info('CATCHUP DONE');

      while (true)
        yield getConfirmedBlockNumber(await new Promise(resolve => provider.once('block', resolve)), this.config.generalConfirmationsDepth);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to generate block number. ' + err.message);
    }
  }

  async * genContiguousConfirmedBlockRanges() {
    let fromBlock, toBlock;

    for await (const latestConfirmedBlockNo of this.genLatestConfirmedBlockNumbers()) {
      fromBlock = fromBlock || latestConfirmedBlockNo;

      const blockCount = latestConfirmedBlockNo - fromBlock + 1;
      const r = blockCount % this.config.maxBlockQueryRange;
      toBlock = fromBlock + r - 1;

      yield { fromBlock, toBlock };
      fromBlock = toBlock + 1;

      const q = Math.floor(blockCount / this.config.maxBlockQueryRange);

      for (let i = 1; i <= q; ++i) {
        toBlock = fromBlock + this.config.maxBlockQueryRange - 1;
        yield { fromBlock, toBlock };
        fromBlock = toBlock + 1;
      }
    }
  }

  async * genLatestConfirmedLogs(topics) {
    const provider = await providerFactory.acquireProvider();

    for await (const { fromBlock, toBlock } of this.genContiguousConfirmedBlockRanges()) {
      const logs = await provider.getLogs({ fromBlock, toBlock, topics });

      for (const log of logs)
        yield log;
    }
  }

  async * genPseudoEvents(topics) {
    for await (const log of this.genLatestConfirmedLogs(topics)) {
      const contract = contractRepository.tryGetContractFromAddress(log.address);

      if (!contract)
        throw new Error('Event generator could not find contract by address: ' + log.address);

      const parsedLog = contract.interface.parseLog(log);
      const eventArgs = [];

      for (let i = 0; parsedLog.values[i]; ++i)
        eventArgs.push(parsedLog.values[i]);

      const event = Object.values(contract.interface.events).find(event => event.topic === log.topics[0]);
      const eventTag = contract.contractName + '.' + event.name;

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

      for (const callback of this.listeners(eventTag))
        await callback(blockNo, ...eventArgs);
    }

    _isStarted.set(this, false);
  }
}

module.exports = EventGenerator;
