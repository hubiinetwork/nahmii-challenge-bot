'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const FakeNahmiiProvider = require('../nahmii-provider-factory/fake-nahmii-provider');

const given = describe;
const when = describe;
const then = it;


describe('event-generator', () => {
  let EventGenerator, eventGenerator, fakeNahmiiProvider;

  beforeEach(() => {
    fakeNahmiiProvider = new FakeNahmiiProvider();
    EventGenerator = proxyquire('./event-generator', {
      '../nahmii-provider-factory': { acquireProvider: async () => fakeNahmiiProvider }
    });
    eventGenerator = new EventGenerator();
    eventGenerator.config.blockPullDelayMs = 100;
  });

  given('an EventGenerator', () => {
    when('constructing an new instance', () => {

      then('a new instance is created', () => {
        expect(eventGenerator).to.be.instanceOf(EventGenerator);
      });

      // config

      const mutableProperties = [
        'firstConfirmationsDepth',
        'generalConfirmationsDepth',
        'blockPullDelayMs'
      ];

      for (const mutableProperty of mutableProperties) {
        it(`has a configurable #${mutableProperty}`, () => {
          expect(eventGenerator.config[mutableProperty]).to.not.be.undefined;
          const v0 = eventGenerator.config[mutableProperty];
          eventGenerator.config[mutableProperty] = v0 + 1;
          expect(eventGenerator.config[mutableProperty]).to.equal(v0 + 1);
        });
      }

      // generators

      it('has block number generator for latest confirmed blocks', () => {
        expect(eventGenerator.genLatestConfirmedBlockNumbers).to.not.be.undefined;
        expect(eventGenerator.genLatestConfirmedBlockNumbers.constructor.name).to.equal('AsyncGeneratorFunction');
      });

      it('has block number generator for sequence of latest confirmed blocks', () => {
        expect(eventGenerator.genSequenceOfLatestConfirmedBlockNumbers).to.not.be.undefined;
        expect(eventGenerator.genSequenceOfLatestConfirmedBlockNumbers.constructor.name).to.equal('AsyncGeneratorFunction');
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

  given('an confirmed block number generator', () => {
    let blockNoItr;

    beforeEach(() => {
      blockNoItr = eventGenerator.genLatestConfirmedBlockNumbers();
    });

    when('generating block numbers', () => {
      it('generates block numbers with no confirmations', async () => {
        eventGenerator.config.firstConfirmationsDepth = 0;
        eventGenerator.config.generalConfirmationsDepth = 0;

        for (let i = 10; i <= 20; ++i) {
          fakeNahmiiProvider.setBlockNumber(i);
          expect((await blockNoItr.next()).value).to.be.equal(i);
        }
      });

      it('generates block numbers with confirmations', async () => {
        eventGenerator.config.firstConfirmationsDepth = 2;
        eventGenerator.config.generalConfirmationsDepth = 2;

        for (let i = 10; i <= 20; ++i) {
          fakeNahmiiProvider.setBlockNumber(i);
          expect((await blockNoItr.next()).value).to.be.equal(i - 2);
        }
      });

      it('generates block numbers that are strictly positive despite large confirmation requirement', async () => {
        eventGenerator.config.firstConfirmationsDepth = 100;
        eventGenerator.config.generalConfirmationsDepth = 100;
        fakeNahmiiProvider.setBlockNumber(10);
        expect((await blockNoItr.next()).value).to.be.equal(0);
      });
    });
  });

  given('a generator creating sequence of latest block numbers', () => {
    let blockNoGen;

    beforeEach(() => {
      eventGenerator.config.firstConfirmationsDepth = 0;
      eventGenerator.config.generalConfirmationsDepth = 0;
      blockNoGen = eventGenerator.genSequenceOfLatestConfirmedBlockNumbers();
    });

    when('generating block numbers', () => {
      it('creates unique and strictly increasing block numbers', async () => {
        const blockNos = [];

        fakeNahmiiProvider.setBlockNumber(0);
        blockNos.push((await blockNoGen.next()).value);

        for (let i = 2; i < (3 * 2); i += 2) {
          fakeNahmiiProvider.setBlockNumber(i);
          blockNos.push((await blockNoGen.next()).value);
          blockNos.push((await blockNoGen.next()).value);
        }

        for (let i = 1; i < blockNos.length; ++i)
          expect(blockNos[i] - blockNos[i-1]).to.equal(1);
      });

      it('it delays until next block number is available', async () => {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const scenarios = [
          { blockNo: 10, blockCounter: 1 },
          { blockNo: 10, blockCounter: 1 }, // Delayed
          { blockNo: 11, blockCounter: 2 } //  until next blockNo
        ];

        let blockCounter = 0;

        for (const scenario of scenarios) {
          fakeNahmiiProvider.setBlockNumber(scenario.blockNo);

          blockNoGen.next().then(() => ++blockCounter);
          const interval = eventGenerator.config.blockPullDelayMs + 100;
          await delay(interval);
          expect(blockCounter).to.equal(scenario.blockCounter);
        }
      });
    });
  });
});