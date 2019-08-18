'use strict';

const EventEmitter = require('events');
const { logger } = require('@hubiinetwork/logger');
const moment = require('../utils/moment');

const contractRepository = require('../contract-repository');
const providerFactory = require('../nahmii-provider-factory');
const t = require('../utils/type-validator');

// EventGeneratorConfig
const _blockPullDelayMs = new WeakMap();
const _maxBlockQueryRange = new WeakMap();
const _catchupConfirmationsDepth = new WeakMap();
const _generalConfirmationsDepth = new WeakMap();

class EventGeneratorConfig {
  constructor (blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth) {
    t.uint().assert(blockPullDelayMs);
    t.uint().assert(maxBlockQueryRange);
    t.uint().assert(catchupConfirmationsDepth);
    t.uint().assert(generalConfirmationsDepth);

    _blockPullDelayMs.set(this, blockPullDelayMs);
    _maxBlockQueryRange.set(this, maxBlockQueryRange);
    _catchupConfirmationsDepth.set(this, catchupConfirmationsDepth);
    _generalConfirmationsDepth.set(this, generalConfirmationsDepth);
    Object.seal(this);
  }

  get blockPullDelayMs () {
    return _blockPullDelayMs.get(this);
  }

  get maxBlockQueryRange () {
    return _maxBlockQueryRange.get(this);
  }

  get catchupConfirmationsDepth () {
    return _catchupConfirmationsDepth.get(this);
  }

  get generalConfirmationsDepth () {
    return _generalConfirmationsDepth.get(this);
  }
}

// EventGenerator state
const _isStarted = new WeakMap();
const _config = new WeakMap();

class EventGenerator extends EventEmitter {
  constructor (blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth) {
    super();
    _isStarted.set(this, false);
    _config.set(this, new EventGeneratorConfig(blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth));
  }

  // properties

  get config () {
    return _config.get(this);
  }

  // functions

  getConfirmedBlockNumber (latestBlockNo, confirmationsDepth) {
    const latestConfirmedBlockNo = Math.max(latestBlockNo - confirmationsDepth, 0);

    logger.info(`Block ${latestConfirmedBlockNo} (${latestBlockNo})`);

    return latestConfirmedBlockNo;
  }

  async getLatestBlockNumber () {
    const provider = await providerFactory.acquireProvider();
    const latestBlockNo = await provider.getBlockNumber();

    return latestBlockNo;
  }

  async getNextEmittedBlockNumber () {
    const provider = await providerFactory.acquireProvider();
    const emittedBlockNo = await new Promise(resolve => provider.once('block', resolve));

    return emittedBlockNo;
  }

  // generators

  async * genEmittedBlockNumbers () {
    while (true)
      yield await this.getNextEmittedBlockNumber();
  }

  async * genCatchupBlockNumbers () {
    const unconfirmedFromBlock = await this.getLatestBlockNumber();

    const unconfirmedToBlock = (this.config.catchupConfirmationsDepth === this.config.generalConfirmationsDepth)
      ? await this.getNextEmittedBlockNumber()
      : unconfirmedFromBlock;

    const fromBlock = this.getConfirmedBlockNumber(unconfirmedFromBlock, this.config.catchupConfirmationsDepth);
    const toBlock = this.getConfirmedBlockNumber(unconfirmedToBlock, this.config.generalConfirmationsDepth);

    yield fromBlock;
    yield toBlock;
  }

  async * genLatestConfirmedBlockNumbers () {
    for await (const latestBlockNo of this.genEmittedBlockNumbers())
      yield this.getConfirmedBlockNumber(latestBlockNo, this.config.generalConfirmationsDepth);
  }

  async * genConfirmedBlockNumbers () {

    const catchupStart = Date.now();
    logger.info(' ');
    logger.info('CATCHUP started');

    for await (const catchupBlockNo of this.genCatchupBlockNumbers())
      yield catchupBlockNo;

    const catchupEnd = Date.now();
    const catchupDuration = moment.duration((catchupEnd - catchupStart) / 1000, 'seconds');
    logger.info(' ');
    logger.info('CATCHUP ended after ' + catchupDuration.format('h[h] m[m] s[s]'));
    logger.info(' ');

    for await (const confirmedBlockNo of this.genLatestConfirmedBlockNumbers())
      yield confirmedBlockNo;
  }

  async * genContiguousConfirmedBlockRanges() {
    const confirmedBlockNumbersItr = this.genConfirmedBlockNumbers();
    let fromBlock = (await confirmedBlockNumbersItr.next()).value;

    for await (const toBlock of confirmedBlockNumbersItr) {
      yield { fromBlock, toBlock };
      fromBlock = toBlock + 1;
    }
  }

  async * genClampedConfirmedBlockRanges() {
    for await (const unclampedBlockRange of this.genContiguousConfirmedBlockRanges()) {
      const unclampedRangeSize = unclampedBlockRange.toBlock - unclampedBlockRange.fromBlock + 1;
      const clampedRangeSize = this.config.maxBlockQueryRange;

      const clampedRangeCount = Math.floor(unclampedRangeSize / clampedRangeSize);
      const remainingRangeSize = unclampedRangeSize % clampedRangeSize;

      const q = clampedRangeCount;
      const r = remainingRangeSize;
      const b0 = unclampedBlockRange.fromBlock;
      const s = clampedRangeSize;

      for (let i = 0; i < q; ++i)
        yield { fromBlock: b0 + s * i, toBlock: b0 + s * (i + 1) - 1 };

      if (r !== 0)
        yield { fromBlock: b0 + s * q, toBlock: b0 + s * q + r - 1 };
    }
  }

  async * genLatestConfirmedLogs(topics) {
    const provider = await providerFactory.acquireProvider();

    for await (const { fromBlock, toBlock } of this.genClampedConfirmedBlockRanges()) {
      t.uint().assert(fromBlock);
      t.uint().assert(toBlock);
      const logs = await provider.getLogs({ fromBlock, toBlock, topics });

      for (const log of logs)
        yield log;
    }
  }

  async * genPseudoEvents(topics) {
    for await (const log of this.genLatestConfirmedLogs(topics)) {
      const contract = contractRepository.tryGetContractFromAddress(log.address);

      if (!contract) {
        logger.info(' ');
        logger.info('SKIPPED: Event generator could not find contract by address: ' + log.address);
        logger.info('    Possibly event from an old nahmii contract.');
        await new Promise(resolve => setTimeout(resolve, 0)); // Avoid event starving
        continue;
      }

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
