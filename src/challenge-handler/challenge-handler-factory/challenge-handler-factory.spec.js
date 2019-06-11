'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const nock = require('nock');
const MetaServiceNocker = require('../../cluster-information/meta-service-nocker');


const FakeNahmiiContract = require('../contract-repository/fake-nahmii-contract');

const fakeNahmiiSdk = {
  NahmiiContract: FakeNahmiiContract
};

function proxyquireStubbedContractRepositoryModule () {
  return proxyquire('../contract-repository/contract-repository', {
    'nahmii-sdk': fakeNahmiiSdk
  });
}

class FakeChallengeHandler {
  constructor () {
    this.handleDSCStart = sinon.stub();
    this.handleNSCStart = sinon.stub();
    this.handleWalletLocked = sinon.stub();
    this.handleBalancesSeized = sinon.stub();
  }
}

describe('challenge-handler-factory', () => {
  let fakeContractRepository;
  let fakeChallengeHandler;
  let StubbedChallengeHandlerFactory;

  beforeEach(async () => {
    const fakeWallet = {};
    const gasLimit = ethers.utils.bigNumberify(0);
    nock.disableNetConnect();
    MetaServiceNocker.resolveWithData();

    fakeContractRepository = new proxyquireStubbedContractRepositoryModule();

    StubbedChallengeHandlerFactory = proxyquire('./challenge-handler-factory', {
      '../challenge-handler': FakeChallengeHandler,
      '../contract-repository': fakeContractRepository
    });

    fakeChallengeHandler = await StubbedChallengeHandlerFactory.create(fakeWallet, gasLimit);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('connects contract events to event handlers', () => {
    it ('StartChallengeFromPaymentEvent to #handleDSCStart()', async function () {
      (await fakeContractRepository.getDriipSettlementChallengeByPayment()).emit('StartChallengeFromPaymentEvent', 'ok');
      expect(fakeChallengeHandler.handleDSCStart.calledOnceWith('ok')).to.be.true;
    });

    it ('StartChallengeFromPaymentByProxyEvent to #handleDSCStart()', async function () {
      (await fakeContractRepository.getDriipSettlementChallengeByPayment()).emit('StartChallengeFromPaymentByProxyEvent', 'ok');
      expect(fakeChallengeHandler.handleDSCStart.calledOnceWith('ok')).to.be.true;
    });

    it ('ChallengeByPaymentEvent to #handleWalletLocked()', async function () {
      (await fakeContractRepository.getDriipSettlementChallengeByPayment()).emit('ChallengeByPaymentEvent', 'ok');
      expect(fakeChallengeHandler.handleWalletLocked.calledOnceWith('DSC Locked', 'ok')).to.be.true;
    });

    it ('StartChallengeEvent to #handleNSCStart()', async function () {
      (await fakeContractRepository.getNullSettlementChallengeByPayment()).emit('StartChallengeEvent', 'ok');
      expect(fakeChallengeHandler.handleNSCStart.calledOnceWith('ok')).to.be.true;
    });

    it ('StartChallengeByProxyEvent to #handleNSCStart()', async function () {
      (await fakeContractRepository.getNullSettlementChallengeByPayment()).emit('StartChallengeByProxyEvent', 'ok');
      expect(fakeChallengeHandler.handleNSCStart.calledOnceWith('ok')).to.be.true;
    });

    it ('ChallengeByPaymentEvent to #handleWalletLocked()', async function () {
      (await fakeContractRepository.getNullSettlementChallengeByPayment()).emit('ChallengeByPaymentEvent', 'ok');
      expect(fakeChallengeHandler.handleWalletLocked.calledOnceWith('NSC Locked', 'ok')).to.be.true;
    });

    it ('SeizeBalancesEvent to #handleBalancesSeized()', async function () {
      (await fakeContractRepository.getClientFund()).emit('SeizeBalancesEvent', 'ok');
      expect(fakeChallengeHandler.handleBalancesSeized.calledOnceWith('ok')).to.be.true;
    });
  });
});
