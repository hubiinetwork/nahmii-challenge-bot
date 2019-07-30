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


describe('event-generator', () => {
  let EventGenerator, eventGenerator, fakeNahmiiProvider;

  beforeEach(() => {
    fakeNahmiiProvider = new FakeNahmiiProvider();
    EventGenerator = proxyquire('./event-generator', {
      '../nahmii-provider-factory': { acquireProvider: async () => fakeNahmiiProvider },
      '../contract-repository': FakeContractRepository
    });
    eventGenerator = new EventGenerator(100, 1000, 0, 0);
  });

  given('an EventGenerator', () => {
    when('constructing an new instance', () => {

      then('a new instance is created', () => {
        expect(eventGenerator).to.be.instanceOf(EventGenerator);
      });

      // config

      const immutableProperties = [
        'startConfirmationsDepth',
        'generalConfirmationsDepth',
        'blockPullDelayMs'
      ];

      for (const immutableProperty of immutableProperties) {
        it(`has a configurable #${immutableProperty}`, () => {
          expect(eventGenerator.config[immutableProperty]).to.not.be.undefined;
        });
      }

      // generators

      it('has block number generator for latest confirmed blocks', () => {
        expect(eventGenerator.genLatestConfirmedBlockNumbers).to.not.be.undefined;
        expect(eventGenerator.genLatestConfirmedBlockNumbers.constructor.name).to.equal('AsyncGeneratorFunction');
      });

      it('has block number generator for sequence of latest confirmed blocks', () => {
        expect(eventGenerator.genContiguousConfirmedBlockRanges).to.not.be.undefined;
        expect(eventGenerator.genContiguousConfirmedBlockRanges.constructor.name).to.equal('AsyncGeneratorFunction');
      });

      it('has log generator for sequence of latest confirmed logs', () => {
        expect(eventGenerator.genLatestConfirmedLogs).to.not.be.undefined;
        expect(eventGenerator.genLatestConfirmedLogs.constructor.name).to.equal('AsyncGeneratorFunction');
      });

      it('has pseudo event generator', () => {
        expect(eventGenerator.genLatestConfirmedLogs).to.not.be.undefined;
        expect(eventGenerator.genLatestConfirmedLogs.constructor.name).to.equal('AsyncGeneratorFunction');
      });
    });

    when('started', () => {

      async function* genFakePseudoEvents () {
        while (true)
          yield { blockNo: 0, eventTag: 'testEvent', eventArgs: [] };
      }

      beforeEach(() => {
        sinon.stub(eventGenerator, 'genPseudoEvents');
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

  given('latest confirmed block number generator #genLatestConfirmedBlockNumbers()', () => {

    when('generating block numbers', () => {
      it('generates block numbers with no confirmations', async () => {
        eventGenerator = new EventGenerator(100, 1000, 0, 0);
        const blockNoItr = eventGenerator.genLatestConfirmedBlockNumbers();

        for (let i = 10; i <= 20; ++i) {
          fakeNahmiiProvider.setBlockNumber(i);
          expect((await blockNoItr.next()).value).to.be.equal(i);
        }
      });

      it('generates block numbers with confirmations', async () => {
        eventGenerator = new EventGenerator(100, 1000, 2, 2);
        const blockNoItr = eventGenerator.genLatestConfirmedBlockNumbers();

        for (let i = 10; i <= 20; ++i) {
          fakeNahmiiProvider.setBlockNumber(i);
          expect((await blockNoItr.next()).value).to.be.equal(i - 2);
        }
      });

      it('generates block numbers that are strictly positive despite large confirmation requirement', async () => {
        eventGenerator = new EventGenerator(100, 1000, 100, 100);
        const blockNoItr = eventGenerator.genLatestConfirmedBlockNumbers();

        fakeNahmiiProvider.setBlockNumber(10);
        expect((await blockNoItr.next()).value).to.be.equal(0);
      });
    });
  });

  given('a contiguous block range generator #genContiguousConfirmedBlockRanges()', () => {
    let blockRangeGen;

    beforeEach(() => {
      blockRangeGen = eventGenerator.genContiguousConfirmedBlockRanges();
    });

    async function* fakeGenLatestConfirmedBlockNumbers (firstBlockNo, step) {
      while (true) {
        yield firstBlockNo;
        firstBlockNo += step;
      }
    }

    when('generating block ranges', () => {
      it ('creates contiguous block ranges if block step is 1', async () => {
        sinon.stub(eventGenerator, 'genLatestConfirmedBlockNumbers').returns(fakeGenLatestConfirmedBlockNumbers(0, 1));
        const contiguousItr = eventGenerator.genContiguousConfirmedBlockRanges();
        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await contiguousItr.next()).value;
          expect(fromBlock).to.equal(i);
          expect(toBlock).to.equal(i);
        }
      });

      it ('creates contiguous block ranges if block step is 10', async () => {
        sinon.stub(eventGenerator, 'genLatestConfirmedBlockNumbers').returns(fakeGenLatestConfirmedBlockNumbers(0, 10));
        const contiguousItr = eventGenerator.genContiguousConfirmedBlockRanges();
        let oldToBlock = -1;
        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await contiguousItr.next()).value;
          expect(fromBlock).to.equal(oldToBlock + 1);
          expect(fromBlock).to.equal(i ? 1 + (i - 1) * 10 : 0);
          expect(toBlock).to.equal(i ? i * 10 : 0);
          oldToBlock = toBlock;
        }
      });

      it ('creates contiguous block ranges if block step is larger than max range', async () => {
        const blockRange = Math.floor(1.3 * eventGenerator.config.maxBlockQueryRange);
        sinon.stub(eventGenerator, 'genLatestConfirmedBlockNumbers').returns(fakeGenLatestConfirmedBlockNumbers(0, blockRange));
        const contiguousItr = eventGenerator.genContiguousConfirmedBlockRanges();
        let oldToBlock = -1;
        for (let i = 0; i < 10; ++i) {
          const { fromBlock, toBlock } = (await contiguousItr.next()).value;
          expect(fromBlock).to.equal(oldToBlock + 1);
          expect(toBlock - fromBlock).to.be.lte(blockRange);
          oldToBlock = toBlock;
        }
      });
    });
  });

  given('a pseudo-event generator #genPseudoEvents()', () => {
    let pseudoEventItr, contractAddress;

    async function* genFakeLatestConfirmedLogs () {
      const log = require('./nsc-start-log.json')[0];
      const contract = await FakeContractRepository.acquireContract('NullSettlementChallengeByPayment');
      contract.address = contractAddress;
      contract.interface.events.StartChallengeEvent.topic = log.topics[0];
      contract.interface.parseLog.returns(require('./nsc-start-parsed-log.json')[0]);

      while (true)
        yield log;
    }

    beforeEach(() => {
      contractAddress = undefined;
      sinon.stub(eventGenerator, 'genLatestConfirmedLogs');
      eventGenerator.genLatestConfirmedLogs.returns(genFakeLatestConfirmedLogs());
      const fakeTopics = [{}];
      pseudoEventItr = eventGenerator.genPseudoEvents(fakeTopics);
    });

    when('generating pseudo events', () => {
      it ('can return a pseudo event if available', async () => {
        contractAddress = require('./nsc-start-log.json')[0].address;
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