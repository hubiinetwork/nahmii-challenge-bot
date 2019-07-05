'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

const given = describe;
const when = describe;
const then = it;

const EventGenerator = require('./event-generator');

function getNewStubbedEventGenerator (fakeProvider) {
  return new (proxyquire('./event-generator', {
    '../nahmii-provider-factory': { acquireProvider: async () => fakeProvider }
  }))();
}

describe('event-generator', () => {

  given('an EventGenerator constructor', () => {
    when('called to construct an new instance', () => {
      let eventGenerator;

      beforeEach(() => {
        eventGenerator = new EventGenerator();
      });

      then('a new instance is created', () => {
        expect(eventGenerator).to.be.instanceOf(EventGenerator);
      });

      // config

      it('has a mutable confirmation depth config', () => {
        expect(eventGenerator.config.confirmationsDepth).to.not.be.undefined;
        const v0 = eventGenerator.config.confirmationsDepth;
        eventGenerator.config.confirmationsDepth = v0 + 1;
        expect(eventGenerator.config.confirmationsDepth).to.equal(v0 + 1);
      });

      it('has a mutable block pull delay config', () => {
        expect(eventGenerator.config.blockPullDelayMs).to.not.be.undefined;
        const v0 = eventGenerator.config.blockPullDelayMs;
        eventGenerator.config.blockPullDelayMs = v0 + 1;
        expect(eventGenerator.config.blockPullDelayMs).to.equal(v0 + 1);
      });

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
  });

  given('an confirmed block number generator', () => {
    let stubbedEventGenerator, blockNoItr;

    const fakeProvider = {
      once: sinon.stub()
    };

    beforeEach(() => {
      stubbedEventGenerator = getNewStubbedEventGenerator(fakeProvider);
      stubbedEventGenerator.config.blockPullDelayMs = 100;
      blockNoItr = stubbedEventGenerator.genLatestConfirmedBlockNumbers();
    });

    afterEach(() => {
      fakeProvider.once.reset();
    });

    when('generating block numbers', () => {
      it('generates block numbers with no confirmations', async () => {
        stubbedEventGenerator.config.confirmationsDepth = 0;

        for (let i = 10; i <= 20; ++i) {
          fakeProvider.once.callsArgWith(1, i);
          expect((await blockNoItr.next()).value).to.be.equal(i);
        }
      });

      it('generates block numbers with confirmations', async () => {
        stubbedEventGenerator.config.confirmationsDepth = 2;

        for (let i = 10; i <= 20; ++i) {
          fakeProvider.once.callsArgWith(1, i);
          expect((await blockNoItr.next()).value).to.be.equal(i - 2);
        }
      });

      it('generates block numbers that are strictly positive despite large confirmation requirement', async () => {
        stubbedEventGenerator.config.confirmationsDepth = 100;
        fakeProvider.once.callsArgWith(1, 10);
        expect((await blockNoItr.next()).value).to.be.equal(0);
      });
    });
  });

  given('a generator creating sequence of latest block numbers', () => {
    let stubbedEventGenerator, blockNoGen;

    const fakeProvider = {
      once: sinon.stub()
    };

    beforeEach(() => {
      stubbedEventGenerator = getNewStubbedEventGenerator(fakeProvider);
      stubbedEventGenerator.config.confirmationsDepth = 0;
      stubbedEventGenerator.config.blockPullDelayMs = 100;
      blockNoGen = stubbedEventGenerator.genSequenceOfLatestConfirmedBlockNumbers();
    });

    afterEach(() => {
      fakeProvider.once.reset();
    });

    when('generating block numbers', () => {
      it('creates unique and strictly increasing block numbers', async () => {
        const blockNos = [];

        fakeProvider.once.callsArgWith(1, 0);
        blockNos.push((await blockNoGen.next()).value);

        for (let i = 2; i < (3 * 2); i += 2) {
          fakeProvider.once.callsArgWith(1, i);
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
          fakeProvider.once.callsArgWith(1, scenario.blockNo);

          blockNoGen.next().then(() => ++blockCounter);
          const interval = stubbedEventGenerator.config.blockPullDelayMs + 100;
          await delay(interval);
          expect(blockCounter).to.equal(scenario.blockCounter);
        }
      });
    });
  });
});