'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const nock = require('nock');

const MetaServiceNocker = require('../cluster-information/meta-service-nocker');

class FakeContract {
  constructor () {
    this.callbacks = {};
  }
  on (eventName, cb) {
    this.callbacks[eventName] = cb;
  }
  emitEvent(eventName, ...args) {
    if (this.callbacks[eventName])
      this.callbacks[eventName](...args);
    else
      throw new Error (`Failed to emit event for unknown event name ${eventName}`);
  }
  connect () {
    return this;
  }
}

class FakeDriipSettlementChallengeByPaymentContract extends FakeContract {
  constructor () {
    super();
  }
  emitStartChallengeFromPaymentEvent (...args) {
    super.emitEvent('StartChallengeFromPaymentEvent', ...args);
  }
  challengeByPayment () {
    return Promise.resolve();
  }
}

class FakeNullSettlementChallengeByPaymentContract extends FakeContract {
  emitStartChallengeEvent (...args) {
    super.emitEvent('StartChallengeEvent', ...args);
  }
  challengeByPayment () {
    return Promise.resolve();
  }
}

class FakeBalanceTrackerContract extends FakeContract {
  constructor () {
    super();
    this.activeBalanceTypes = sinon.stub();
    this.get = sinon.stub();
    this.fungibleRecordByBlockNumber = sinon.stub();
  }
}

class FakeContractFactory {
  constructor () {
    this.contracts = {};
    this.contracts['ClientFund'] = new FakeContract();
    this.contracts['DriipSettlementChallengeByPayment'] = new FakeDriipSettlementChallengeByPaymentContract();
    this.contracts['NullSettlementChallengeByPayment'] = new FakeNullSettlementChallengeByPaymentContract();
    this.contracts['BalanceTracker'] = new FakeBalanceTrackerContract();
    this.contracts['DriipSettlementDisputeByPayment'] = new FakeContract();
    this.contracts['NullSettlementDisputeByPayment'] = new FakeContract();
  }

  get (contractName) {
    if (this.contracts[contractName])
      return this.contracts[contractName];
    else
      throw new Error (`Failed to create fake contract ${contractName}`);
  }

  async create (contractName, provider) {
    return this.get(contractName);
  }
}

const initiator = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
const sender = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
const recipient = '0xcaf8bf7c0aab416dde4fe3c20c173e92afff8d72';
const ct = '0x0000000000000000000000000000000000000000';
const id = 0;
const bnZero = ethers.utils.bigNumberify(0);

const walletMock = {
  provider: {
    getWalletReceipts: sinon.stub()
  }
};

const gasLimit = ethers.utils.bigNumberify(
  2000000
);

describe('ChallengeHandler', () => {
  let receipts;
  let fakeContractFactory;
  let handler;
  let driipSettlementChallengeByPaymentContract;
  let nullSettlementChallengeByPaymentContract;
  let balanceTrackerContract;
  let StubbedChallengeHandler;

  before(() => {
    MetaServiceNocker.resolveWithData();
  })

  beforeEach(async () => {
    nock.disableNetConnect();
    MetaServiceNocker.resolveWithData();
    fakeContractFactory = new FakeContractFactory();

    const StubbedContractRepository = proxyquire('./contract-repository/contract-repository', {
      '../../contract-factory': fakeContractFactory
    });

    StubbedChallengeHandler = proxyquire('./challenge-handler', {
      './progress-notifier': proxyquire('./progress-notifier/progress-notifier', {
        '@hubiinetwork/logger': { logger: { info: () => {} }}
      }),
      './contract-repository': StubbedContractRepository
    });

    const StubbedChallengeHandlerFactory = proxyquire('./challenge-handler-factory', {
      './challenge-handler': StubbedChallengeHandler,
      './contract-repository': StubbedContractRepository
    });

    receipts = require('./receipts.spec.data.json');
    handler = await StubbedChallengeHandlerFactory.create(walletMock, gasLimit);

    walletMock.provider.getWalletReceipts.returns(receipts);

    driipSettlementChallengeByPaymentContract = fakeContractFactory.get('DriipSettlementChallengeByPayment');
    nullSettlementChallengeByPaymentContract = fakeContractFactory.get('NullSettlementChallengeByPayment');

    balanceTrackerContract = fakeContractFactory.get('BalanceTracker');
    balanceTrackerContract.activeBalanceTypes.returns(Promise.resolve([
      '0xb813b2537a176df7231d1715fbcd8fb847032c45ba860572b1abb88bf4ec2d0e',
      '0x2481b1d2de4705a3d6f16fcad41f3da3d5cea523dcc13e7e981eacc3bb0569dd'
    ]));
    balanceTrackerContract.get.returns(Promise.resolve(bnZero));
    balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  })

  describe ('Calls callbacks on important operation events', function () {
    const wallet = sender;
    const nonce = ethers.utils.bigNumberify(3);
    const cumulativeTransferAmount = null;
    const stageAmount = ethers.utils.parseEther('5');
    const targetBalanceAmount = null;

    it('onDSCStart', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onDSCStart(resolved));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onDSCAgreed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onDSCAgreed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onDSCDisputed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onDSCDisputed(resolved));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCStart', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onNSCStart(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      //balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('10') }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCAgreed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onNSCAgreed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCDisputed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onNSCDisputed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('5')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('5') }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

  });

  describe('#getProofCandidate()', function () {
    it ('handles non-continuous nonces', function () {
      const stagedAmount = ethers.utils.bigNumberify(1);
      const clonedReceipts = JSON.parse(JSON.stringify(receipts));
      const senderReceipts = clonedReceipts.filter(r => r.sender.wallet === sender).map(r => (r.sender.nonce *= 2, r));
      return expect(StubbedChallengeHandler.getProofCandidate(balanceTrackerContract, senderReceipts, sender, ct, id, stagedAmount)).to.eventually.be.fulfilled;
    });
  });
});
