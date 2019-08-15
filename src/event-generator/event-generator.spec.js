'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const FakeNahmiiProvider = require('../nahmii-provider-factory/fake-nahmii-provider');
const FakeContractRepository = require('../contract-repository/fake-contract-repository');

const given = describe;
const when = describe;
const xgiven = xdescribe;
const then = it;

function getNewStubbedEventGenerator (blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth) {
  const fakeNahmiiProvider = new FakeNahmiiProvider();

  const EventGenerator = proxyquire('./event-generator', {
    '../nahmii-provider-factory': { acquireProvider: async () => fakeNahmiiProvider },
    '../contract-repository': FakeContractRepository
  });

  const eventGenerator = new EventGenerator(blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth);
  eventGenerator.fakeNahmiiProvider = fakeNahmiiProvider;

  sinon.stub(eventGenerator, 'getLatestBlockNumber');
  sinon.stub(eventGenerator, 'getNextEmittedBlockNumber');
  sinon.stub(eventGenerator, 'genEmittedBlockNumbers');
  sinon.stub(eventGenerator, 'genCatchupBlockNumbers');
  sinon.stub(eventGenerator, 'genLatestConfirmedBlockNumbers');
  sinon.stub(eventGenerator, 'genConfirmedBlockNumbers');
  sinon.stub(eventGenerator, 'genContiguousConfirmedBlockRanges');
  sinon.stub(eventGenerator, 'genClampedConfirmedBlockRanges');
  sinon.stub(eventGenerator, 'genLatestConfirmedLogs');
  sinon.stub(eventGenerator, 'genPseudoEvents');

  return eventGenerator;
}


describe('event-generator', () => {

  given('an EventGenerator', () => {
    let eventGenerator;

    beforeEach(() => {
      eventGenerator = getNewStubbedEventGenerator(0, 0, 0, 0);
    });

    when('constructing an new instance', () => {

      then('a new instance is created', () => {
        expect(eventGenerator.constructor.name).to.equal('EventGenerator');
      });

      [
        'catchupConfirmationsDepth',
        'generalConfirmationsDepth',
        'blockPullDelayMs',
        'maxBlockQueryRange'
      ].forEach(propertyName => {
        it(`has the configurable property #${propertyName}`, () => {
          expect(eventGenerator.config[propertyName]).to.not.be.undefined;
        });
      });

      it('has action #runWhile()', () => {
        expect(eventGenerator['runWhile']).to.not.be.undefined;
      });
    });

    when('started', () => {

      async function* genFakePseudoEvents () {
        while (true)
          yield { blockNo: 0, eventTag: 'testEvent', eventArgs: [] };
      }

      beforeEach(() => {
        eventGenerator.genPseudoEvents.returns(genFakePseudoEvents());
      });

      it ('returns immediately if halted', () => {
        return expect(eventGenerator.runWhile([], () => false)).to.eventually.be.fulfilled;
      });

      it ('can be started a second time if halted', () => {
        eventGenerator.runWhile([], () => false);
        return expect(eventGenerator.runWhile([], () => false)).to.eventually.be.fulfilled;
      });

      it ('throws if restarted before halted', () => {
        let shouldRun = true;
        eventGenerator.runWhile([], () => shouldRun);
        const secondRun = eventGenerator.runWhile([], () => shouldRun);
        secondRun.catch(() => shouldRun = false);
        return expect(secondRun).to.eventually.be.rejectedWith(/Cannot start event generator that is already started/);
      });

      it ('emits events', () => {
        return new Promise(resolve => {
          let shouldRun = true;

          eventGenerator.once('testEvent', () => {
            shouldRun = false;
            resolve();
          });

          eventGenerator.runWhile([], () => shouldRun);
        });
      });

      it ('awaits event handling', () => {
        return new Promise(resolve => {
          let shouldRun = true;
          let isEventHandlingInProgress = false;
          let i = 0;

          eventGenerator.on('testEvent', async () => {
            expect(isEventHandlingInProgress).to.be.false;

            isEventHandlingInProgress = true;
            await new Promise(res => setTimeout(res, 100));
            isEventHandlingInProgress = false;

            shouldRun = ++i < 10;

            if (!shouldRun)
              resolve();
          });

          eventGenerator.runWhile([], () => shouldRun);
        });
      });
    });
  });

  given('function #getNextEmittedBlockNumber()', () => {
    let eventGenerator;

    beforeEach(() => {
      eventGenerator = getNewStubbedEventGenerator(0, 0, 0, 0);
      eventGenerator.getNextEmittedBlockNumber.restore();
    });

    when ('emitting blocks', () => {
      it ('returns single block numbers when it is emitted by provider', async () => {
        const blockNoPromise = eventGenerator.getNextEmittedBlockNumber();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(eventGenerator.fakeNahmiiProvider.eventEmitter.emit('block', 7)).to.be.true;
        return expect(blockNoPromise).to.eventually.equal(7);
      });
    });
  });

  given('generator #genEmittedBlockNumbers()', () => {
    let emittedBlockNumbersItr;

    beforeEach(() => {
      const eventGenerator = getNewStubbedEventGenerator(0, 0, 0, 0);
      eventGenerator.getNextEmittedBlockNumber.resolves(7);
      eventGenerator.genEmittedBlockNumbers.restore();
      emittedBlockNumbersItr = eventGenerator.genEmittedBlockNumbers();
    });

    when ('emitting blocks', () => {
      it ('yields block numbers when they are emitted by provider', () => {
        expect(emittedBlockNumbersItr.next()).to.eventually.eql({done: false, value: 7 });
      });
    });
  });

  given('generator #genCatchupBlockNumbers()', () => {
    let getNextEmittedBlockNumber;

    function getPrimedIterator (blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth, blockNumbers) {
      const eventGenerator = getNewStubbedEventGenerator(blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth);

      sinon.stub(eventGenerator, 'config').value({
        blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth
      });

      eventGenerator.getLatestBlockNumber.returns(blockNumbers[0]);
      eventGenerator.getNextEmittedBlockNumber.returns(blockNumbers[1]);
      eventGenerator.genCatchupBlockNumbers.restore();

      getNextEmittedBlockNumber = eventGenerator.getNextEmittedBlockNumber;
      return eventGenerator.genCatchupBlockNumbers();
    }

    when('generating block numbers', () => {

      it ('generates first number according to catchup depth', async () => {
        for (let i = 0; i < 10; ++i) {
          const catchupBlockItr = getPrimedIterator(0, 0, i, 0, [ 10, 33 ]);
          expect((await catchupBlockItr.next()).value).to.equal(10 - i);
        }
      });

      it ('generates second number according to general confirmation depth', async () => {
        for (let i = 0; i < 10; ++i) {
          const catchupBlockItr = getPrimedIterator(0, 0, 100, i, [ 100, 101 ]);
          expect((await catchupBlockItr.next()).value).to.equal(0);
          expect((await catchupBlockItr.next()).value).to.equal(100 - i);
        }
      });

      it ('waits for second number catchup depth and confirmation depth are equal', async () => {
        for (let i = 0; i < 10; ++i) {
          const catchupBlockItr = getPrimedIterator(0, 0, i, i, [ 100, 101 ]);
          expect((await catchupBlockItr.next()).value).to.equal(100 - i);
          expect((await catchupBlockItr.next()).value).to.equal(101 - i);
          expect(getNextEmittedBlockNumber.callCount).to.equal(1);
        }
      });
    });
  });

  given('generator #genLatestConfirmedBlockNumbers()', () => {
    when('generating block numbers', () => {
      const fakeBlockNumbers = [ 5, 6, 7, 8, 9, 10 ];

      function getPrimedIteratorAndProvider (blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth) {
        const eventGenerator = getNewStubbedEventGenerator(blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth);

        sinon.stub(eventGenerator, 'config').value({
          blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth
        });

        eventGenerator.genEmittedBlockNumbers.value(async function* () {
          for (const blockNo of fakeBlockNumbers)
            yield blockNo;
        });

        eventGenerator.genLatestConfirmedBlockNumbers.restore();
        return eventGenerator.genLatestConfirmedBlockNumbers();
      }

      it('generates block numbers with no confirmations', async () => {
        const blockNoItr = getPrimedIteratorAndProvider(100, 1000, 0, 0);

        for (const blockNo of fakeBlockNumbers)
          expect((await blockNoItr.next()).value).to.be.equal(blockNo - 0);
      });

      it('generates block numbers with confirmations', async () => {
        const blockNoItr = getPrimedIteratorAndProvider(100, 1000, 2, 2);

        for (const blockNo of fakeBlockNumbers)
          expect((await blockNoItr.next()).value).to.be.equal(blockNo - 2);
      });

      it('generates block numbers that are strictly positive despite large confirmation requirement', async () => {
        const blockNoItr = getPrimedIteratorAndProvider(100, 1000, 100, 100);

        expect((await blockNoItr.next()).value).to.be.equal(0);
      });
    });
  });

  given('generator #genConfirmedBlockNumbers()', () => {
    const fakeBlockNumbers = [0, 10, 11, 13 ];

    async function* fakeCatchupBlockNumbers() {
      for (const blockNo of fakeBlockNumbers.slice(0, 2))
        yield blockNo;
    }

    async function* fakeLatestConfirmedBlockNumbers() {
      for (const blockNo of fakeBlockNumbers.slice(2))
        yield blockNo;
    }

    function getPrimedIterator () {
      const eventGenerator = getNewStubbedEventGenerator(0, 0, 0, 0);
      eventGenerator.genCatchupBlockNumbers.returns(fakeCatchupBlockNumbers());
      eventGenerator.genLatestConfirmedBlockNumbers.returns(fakeLatestConfirmedBlockNumbers());
      eventGenerator.genConfirmedBlockNumbers.restore();

      return eventGenerator.genConfirmedBlockNumbers();
    }

    when('generating block numbers', () => {
      it ('generates both catchup numbers and general numbers', async () => {
        let i = 0;
        for await (const blockNo of getPrimedIterator())
          expect(blockNo).to.equal(fakeBlockNumbers[i++]);
      });
    });
  });

  given('generator #genContiguousConfirmedBlockRanges()', () => {
    async function* fakeConfirmedBlockNumbers () {
      for (const blockNo of [ 0, 1, 2, 3, 5, 7, 11, 13 ])
        yield blockNo;
    }

    function getPrimedIterator () {
      const blocksItr = fakeConfirmedBlockNumbers();
      const eventGenerator = getNewStubbedEventGenerator(0, 0, 0, 0);
      eventGenerator.genConfirmedBlockNumbers.returns(blocksItr);
      eventGenerator.genContiguousConfirmedBlockRanges.restore();

      return eventGenerator.genContiguousConfirmedBlockRanges();
    }

    when('generating block ranges', () => {
      it ('generates contiguous ranges', async () => {
        let oldToBlock = -1;
        for await (const { fromBlock, toBlock } of getPrimedIterator()) {
          expect(fromBlock).to.equal(oldToBlock + 1);
          oldToBlock = toBlock;
        }
      });
    });
  });

  given('generator #genClampedConfirmedBlockRanges()', () => {
    async function* fakeContiguousConfirmedBlockRanges (fromBlock, step) {
      while (true) {
        const toBlock = fromBlock + step - 1;
        yield { fromBlock, toBlock };
        fromBlock = toBlock + 1;
      }
    }

    function getPrimedIterator (fromBlock, step) {
      const contiguousItr = fakeContiguousConfirmedBlockRanges(fromBlock, step);
      const eventGenerator = getNewStubbedEventGenerator(0, 1000, 0, 0);
      eventGenerator.genContiguousConfirmedBlockRanges.returns(contiguousItr);
      eventGenerator.genClampedConfirmedBlockRanges.restore();

      return eventGenerator.genClampedConfirmedBlockRanges();
    }

    when('generating block ranges', () => {

      it ('creates contiguous block ranges if block step is 1', async () => {
        const clampedBlockRangesItr = getPrimedIterator(0, 1);

        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await clampedBlockRangesItr.next()).value;
          expect(fromBlock).to.equal(i);
          expect(toBlock).to.equal(i);
        }
      });

      it ('creates contiguous block ranges if block step is 10', async () => {
        const clampedBlockRangesItr = getPrimedIterator(0, 10);

        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await clampedBlockRangesItr.next()).value;
          expect(fromBlock).to.equal(i * 10);
          expect(toBlock).to.equal((i + 1) * 10 - 1);
        }
      });

      it ('creates clamped and contiguous block ranges if block step is larger than max range', async () => {
        const blockRange =1300;
        const clampedBlockRangesItr = getPrimedIterator(0, blockRange);
        let oldToBlock = -1;

        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await clampedBlockRangesItr.next()).value;
          expect(fromBlock).to.equal(oldToBlock + 1);
          expect(toBlock - fromBlock).to.be.lte(blockRange);
          oldToBlock = toBlock;
        }
      });

      it ('creates contiguous block ranges if block step is exact max range', async () => {
        const blockRange = 1000;
        const clampedBlockRangesItr = getPrimedIterator(0, blockRange);

        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await clampedBlockRangesItr.next()).value;
          expect(fromBlock).to.equal(i * blockRange);
          expect(toBlock).to.equal((i + 1) * blockRange - 1);
        }
      });
    });
  });

  given('generator #genLatestConfirmedLogs()', () => {
    let latestConfirmedLogsItr;

    async function* fakeClampedConfirmedBlockRanges () {
      yield { fromBlock: 100, toBlock: 101 };
    }

    beforeEach(() => {
      const eventGenerator = getNewStubbedEventGenerator(0, 1000, 0, 0);
      eventGenerator.fakeNahmiiProvider.getLogs.returns(require('./fake-nsc-start-log.json'));
      eventGenerator.genClampedConfirmedBlockRanges.returns(fakeClampedConfirmedBlockRanges());
      eventGenerator.genLatestConfirmedLogs.restore();

      latestConfirmedLogsItr = eventGenerator.genLatestConfirmedLogs();
    });

    when('generating logs', () => {
      let log;

      beforeEach(async () => {
        log = (await latestConfirmedLogsItr.next()).value;
      });

      it ('produces a log', () => {
        expect(log.blockNumber).to.equal(479);
      });
    });
  });

  given('generator #genPseudoEvents()', () => {
    let pseudoEventItr, contractAddress;

    async function* fakeLatestConfirmedLogs () {
      const log = require('./fake-nsc-start-log.json')[0];
      const contract = await FakeContractRepository.acquireContract('NullSettlementChallengeByPayment');
      contract.address = contractAddress;
      contract.interface.events.StartChallengeEvent.topic = log.topics[0];
      contract.interface.parseLog.returns(require('./fake-nsc-start-parsed-log.json')[0]);

      while (true)
        yield log;
    }

    beforeEach(() => {
      contractAddress = undefined;
      const eventGenerator = getNewStubbedEventGenerator(0, 1000, 0, 0);
      eventGenerator.genLatestConfirmedLogs.returns(fakeLatestConfirmedLogs());
      const fakeTopics = [{}];
      eventGenerator.genPseudoEvents.restore();
      pseudoEventItr = eventGenerator.genPseudoEvents(fakeTopics);
    });

    when('generating pseudo events', () => {
      it ('can return a pseudo event if available', async () => {
        contractAddress = require('./fake-nsc-start-log.json')[0].address;
        const pseudoEvent = (await pseudoEventItr.next()).value;

        expect(pseudoEvent).not.to.be.undefined;
        expect(pseudoEvent.blockNo).not.to.be.undefined;
        expect(pseudoEvent.eventTag).not.to.be.undefined;
        expect(pseudoEvent.eventArgs).not.to.be.undefined;
      });

      it ('fails if associated contract cannot be found by address', () => {
        return expect(pseudoEventItr.next()).to.eventually.be.rejectedWith(/Event generator could not find contract by address/);
      });
    });
  });
});