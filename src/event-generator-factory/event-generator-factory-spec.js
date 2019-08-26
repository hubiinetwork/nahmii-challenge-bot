'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const given = describe;
const when = describe;
const then = it;

const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const nock = require('nock');

const FakeContractRepository = require('../contract-repository/fake-contract-repository');
const FakeNahmiiProviderFactory = require('../nahmii-provider-factory/fake-nahmii-provider-factory');
const FakeEventGenerator = require('../event-generator/fake-event-generator');
const FakeBinaryBlockSearcher = require('./binary-block-searcher/fake-binary-block-searcher');

function getStubbedEventGeneratorFactory () {
  return proxyquire('./event-generator-factory', {
    '../contract-repository': FakeContractRepository,
    '../nahmii-provider-factory': FakeNahmiiProviderFactory,
    '../event-generator': FakeEventGenerator,
    './binary-block-searcher': FakeBinaryBlockSearcher
  });
}

describe ('event-generator-factory', () => {
  given ('a EventGeneratorFactory', () => {
    let eventGeneratorFactory, fakeNahmiiProvider;

    beforeEach(async () => {
      nock.disableNetConnect();
      FakeNahmiiProviderFactory.reset();
      FakeBinaryBlockSearcher.reset();
      fakeNahmiiProvider = await FakeNahmiiProviderFactory.acquireProvider();
      eventGeneratorFactory = getStubbedEventGeneratorFactory();
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    when ('creating event generator', () => {
      let eventGenerator;

      beforeEach(async () => {
        const fakeBlock0 = { number: 0, timestamp: 0 };
        const fakeBlock1 = { number: 10, timestamp: 100 };
        fakeNahmiiProvider.getBlock.returns(fakeBlock1);
        fakeNahmiiProvider.getBlock.withArgs(0, 0).returns(fakeBlock0);
        FakeBinaryBlockSearcher.findBlockLte.returns(fakeBlock0);
        eventGenerator = await eventGeneratorFactory.create();
      });

      then('an event generator is created', async () => {
        expect(eventGenerator).to.be.instanceOf(FakeEventGenerator);
      });

      it('has expected config', async () => {
        expect(eventGenerator.config.blockPullDelayMs).to.equal(100);
        expect(eventGenerator.config.maxBlockQueryRange).to.equal(1000);
        expect(eventGenerator.config.catchupConfirmationsDepth).to.equal(9);
        expect(eventGenerator.config.generalConfirmationsDepth).to.equal(12);
      });
    });
  });
});
