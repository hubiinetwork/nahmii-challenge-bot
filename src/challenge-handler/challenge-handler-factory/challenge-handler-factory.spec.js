'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const NestedError = require('../../utils/nested-error');

class FakeContract {
  constructor () {
    this.callbacks = {};
  }

  on (eventName, callback) {
    this.callbacks[eventName] = callback;
  }

  emit (eventName, ...args) {
    if (this.callbacks[eventName])
      this.callbacks[eventName](...args);
    else
      throw new Error('Failed to find callback for event ' + eventName);
  }
}

class FakeContractRepository {
  constructor () {
    this.driipSettlementChallengeByPayment = new FakeContract();
    this.driipSettlementDisputeByPayment = new FakeContract();
    this.nullSettlementChallengeByPayment = new FakeContract();
    this.nullSettlementDisputeByPayment = new FakeContract();
    this.clientFund = new FakeContract();
  }

  async getDriipSettlementChallengeByPayment () {
    return this.driipSettlementChallengeByPayment;
  }
  async getDriipSettlementDisputeByPayment () { return this.driipSettlementDisputeByPayment; }
  async getNullSettlementChallengeByPayment () { return this.nullSettlementChallengeByPayment; }
  async getNullSettlementDisputeByPayment () { return this.nullSettlementDisputeByPayment; }
  async getClientFund () { return this.clientFund; }
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

    fakeContractRepository = new  FakeContractRepository();

    StubbedChallengeHandlerFactory = proxyquire('./challenge-handler-factory', {
      '../challenge-handler': FakeChallengeHandler,
      '../contract-repository': fakeContractRepository
    });

    fakeChallengeHandler = await StubbedChallengeHandlerFactory.create(fakeWallet, gasLimit);
  })

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
      (await fakeContractRepository.getDriipSettlementDisputeByPayment()).emit('ChallengeByPaymentEvent', 'ok');
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
      (await fakeContractRepository.getNullSettlementDisputeByPayment()).emit('ChallengeByPaymentEvent', 'ok');
      expect(fakeChallengeHandler.handleWalletLocked.calledOnceWith('NSC Locked', 'ok')).to.be.true;
    });

    it ('SeizeBalancesEvent to #handleBalancesSeized()', async function () {
      (await fakeContractRepository.getClientFund()).emit('SeizeBalancesEvent', 'ok');
      expect(fakeChallengeHandler.handleBalancesSeized.calledOnceWith('ok')).to.be.true;
    });
  });

  describe('Throws with NestedError is some dependency fails', () => {
    it ('Throws during construction', function () {
      fakeContractRepository.driipSettlementChallengeByPayment = null;
      return expect(StubbedChallengeHandlerFactory.create(null, null)).to.be.rejectedWith(NestedError);
    });
  });
});
