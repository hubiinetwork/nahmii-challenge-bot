'use strict';

const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const nock = require('nock');

const MetaServiceNocker = require('../cluster-information/meta-service-nocker');
const NestedError = require('../utils/nested-error');

const FakeNahmiiContract = require('./contract-repository/fake-nahmii-contract');

const fakeNahmiiSdk = {
  NahmiiContract: FakeNahmiiContract
};

class FakeProgressNotifier {
  constructor () {
    this.notifyWalletLocked = FakeProgressNotifier.notifyWalletLocked;
    this.notifyBalancesSeized = FakeProgressNotifier.notifyBalancesSeized;
    this.notifyWalletLocked.reset();
    this.notifyBalancesSeized.reset();
  }
}
FakeProgressNotifier.notifyWalletLocked = sinon.stub();
FakeProgressNotifier.notifyBalancesSeized = sinon.stub();

const ct = '0x0000000000000000000000000000000000000000';
const id = 0;
const bnZero = ethers.utils.bigNumberify(0);
const challengedWallet = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
const challengerWallet = '0x22d491bde2303f2f43325b2108d26f1eaba1e32b';

const walletMock = {
  provider: {
    getWalletReceipts: sinon.stub()
  },
  address: challengerWallet
};

const gasLimit = ethers.utils.bigNumberify(
  2000000
);

function proxyquireStubbedContractRepositoryModule (nahmiiSdkModule) {
  return proxyquire('./contract-repository/contract-repository', {
    'nahmii-sdk': nahmiiSdkModule
  });
}

function proxyquireStubbedProgressNotifierModule () {
  return proxyquire('./progress-notifier/progress-notifier', {
    '@hubiinetwork/logger': { logger: { info: () => {} }}
  });
}

function proxyquireStubbedChallengeHandlerModule (progressNotifierModule, contractRepositoryModule) {
  return proxyquire('./challenge-handler', {
    './progress-notifier': progressNotifierModule,
    './contract-repository': contractRepositoryModule
  });
}

function proxyquireStubbedChallengeHandlerFactoryModule (progressNotifierModule, contractRepositoryModule) {
  return proxyquire('./challenge-handler-factory/challenge-handler-factory', {
    '../challenge-handler': proxyquireStubbedChallengeHandlerModule (progressNotifierModule, contractRepositoryModule) ,
    '../contract-repository': contractRepositoryModule
  });
}

describe('ChallengeHandler', () => {
  let receipts;
  let handler;
  let clientFundContract;
  let driipSettlementChallengeByPaymentContract;
  let nullSettlementChallengeByPaymentContract;
  let balanceTrackerContract;
  let stubbedContractRepositoryModule;

  beforeEach(async () => {
    nock.disableNetConnect();
    MetaServiceNocker.resolveWithData();

    stubbedContractRepositoryModule = proxyquireStubbedContractRepositoryModule(fakeNahmiiSdk);
    const StubbedChallengeHandlerFactory = proxyquireStubbedChallengeHandlerFactoryModule(proxyquireStubbedProgressNotifierModule(), stubbedContractRepositoryModule);

    receipts = require('./receipts-provider/receipts.spec.data.json');
    handler = await StubbedChallengeHandlerFactory.create(walletMock, gasLimit);

    walletMock.provider.getWalletReceipts.returns(receipts);

    clientFundContract = await stubbedContractRepositoryModule.acquireContract('ClientFund');
    driipSettlementChallengeByPaymentContract = await stubbedContractRepositoryModule.acquireContract('DriipSettlementChallengeByPayment');
    nullSettlementChallengeByPaymentContract = await stubbedContractRepositoryModule.acquireContract('NullSettlementChallengeByPayment');

    balanceTrackerContract = await stubbedContractRepositoryModule.acquireContract('BalanceTracker');
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
  });

  describe ('Calls callbacks on important operation events', function () {
    const nonce = ethers.utils.bigNumberify(3);
    const cumulativeTransferAmount = null;
    const stageAmount = ethers.utils.parseEther('5');
    const targetBalanceAmount = null;

    it('onDSCStart', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onDSCStart(resolved));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(challengedWallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onDSCAgreed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onDSCAgreed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(challengedWallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onDSCDisputed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onDSCDisputed(resolved));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(challengedWallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCStart', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onNSCStart(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      //balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('10') }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCAgreed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onNSCAgreed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCDisputed', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onNSCDisputed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('5')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('5') }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onWalletLocked DSC', async function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onWalletLocked(resolved));
      driipSettlementChallengeByPaymentContract.emitChallengeByPaymentEvent(challengedWallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onWalletLocked NSC', async function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onWalletLocked(resolved));
      nullSettlementChallengeByPaymentContract.emitChallengeByPaymentEvent(challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onBalancesSeized', function () {
      const promisedCallback = new Promise(resolved => handler.callbacks.onBalancesSeized(resolved));
      const amount = stageAmount;
      clientFundContract.emitSeizeBalancesEvent(challengedWallet, challengerWallet, amount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });
  });

  describe('Can filter out foreign events', () => {
    it('#handleWalletLocked() consumes event when challenger addresses match', async function () {
      const stubbedChallengeHandlerFactory = proxyquireStubbedChallengeHandlerFactoryModule(FakeProgressNotifier, stubbedContractRepositoryModule);
      const stubbedChallengeHandler = await stubbedChallengeHandlerFactory.create(walletMock, gasLimit);
      await stubbedChallengeHandler.handleWalletLocked ('caption', challengedWallet, bnZero, bnZero, bnZero, ct, id, challengerWallet);
      expect(FakeProgressNotifier.notifyWalletLocked).to.have.been.calledWith('caption SEIZING:', challengerWallet, challengedWallet, ct, id);
    });

    it('#handleWalletLocked() ignores event when challenger addresses do not match', async function () {
      const stubbedChallengeHandlerFactory = proxyquireStubbedChallengeHandlerFactoryModule(FakeProgressNotifier, stubbedContractRepositoryModule);
      const stubbedChallengeHandler = await stubbedChallengeHandlerFactory.create(walletMock, gasLimit);
      await stubbedChallengeHandler.handleWalletLocked ('caption', challengedWallet, bnZero, bnZero, bnZero, ct, id, challengedWallet);
      expect(FakeProgressNotifier.notifyWalletLocked).to.have.been.calledWith('caption NOT SEIZING:', challengedWallet, challengedWallet, ct, id);
    });

    it('#handleBalancesSeized() consumes event when challenger addresses match', async function () {
      const stubbedChallengeHandlerFactory = proxyquireStubbedChallengeHandlerFactoryModule(FakeProgressNotifier, stubbedContractRepositoryModule);
      const stubbedChallengeHandler = await stubbedChallengeHandlerFactory.create(walletMock, gasLimit);
      await stubbedChallengeHandler.handleBalancesSeized (challengedWallet, challengerWallet, bnZero, ct, id);
      expect(FakeProgressNotifier.notifyBalancesSeized).to.have.been.calledOnce;
    });

    it('#handleBalancesSeized() ignores event when challenger addresses do not match', async function () {
      const stubbedChallengeHandlerFactory = proxyquireStubbedChallengeHandlerFactoryModule(FakeProgressNotifier, stubbedContractRepositoryModule);
      const stubbedChallengeHandler = await stubbedChallengeHandlerFactory.create(walletMock, gasLimit);
      await stubbedChallengeHandler.handleBalancesSeized (challengedWallet, challengedWallet, bnZero, ct, id);
      expect(FakeProgressNotifier.notifyBalancesSeized).to.not.have.been.called;
    });
  });

  describe('Async exceptions are captured and rethrown', () => {
    it('in #handleNSCStart() 1', async function () {
      nullSettlementChallengeByPaymentContract.challengeByPayment.throws(new Error('failure'));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('5')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('5') }));

      return expect(
        handler.handleNSCStart(challengedWallet, ethers.utils.bigNumberify(3), ethers.utils.parseEther('15'), null, ct, id)
      ).to.eventually.be.rejectedWith(/Received unexpected disqualified NSC/);
    });

    it('in #handleDSCStart()', async function () {
      driipSettlementChallengeByPaymentContract.challengeByPayment.throws(new Error('failure'));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('5')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('5') }));

      return expect(
        handler.handleDSCStart(challengedWallet, ethers.utils.bigNumberify(3), null, ethers.utils.parseEther('5'), null, ct, id)
      ).to.eventually.be.rejectedWith(NestedError);
    });

    it('in #handleNSCStart() 2', async function () {
      nullSettlementChallengeByPaymentContract.challengeByPayment.throws(new Error('failure'));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('5')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: ethers.utils.parseEther('5') }));

      return expect(
        handler.handleNSCStart(challengedWallet, ethers.utils.bigNumberify(3), ethers.utils.parseEther('5'), null, ct, id)
      ).to.eventually.be.rejectedWith(NestedError);
    });

    xit('in #handleWalletLocked()', async function () {
      clientFundContract.seizeBalances.throws(new Error('failure'));
      return expect(
        handler.handleWalletLocked ('caption', challengedWallet, bnZero, bnZero, bnZero, ct, id, challengerWallet)
      ).to.eventually.be.rejectedWith(NestedError);
    });
  });

  describe('#getProofCandidate()', function () {
    it ('handles non-continuous nonces', function () {
      const stubbedChallengeHandler = proxyquireStubbedChallengeHandlerModule(
        proxyquireStubbedProgressNotifierModule(), proxyquireStubbedContractRepositoryModule(fakeNahmiiSdk)
      );
      const stagedAmount = ethers.utils.bigNumberify(1);
      const clonedReceipts = JSON.parse(JSON.stringify(receipts));
      const senderReceipts = clonedReceipts.filter(r => r.sender.wallet === challengedWallet).map(r => (r.sender.nonce *= 2, r));
      return expect(stubbedChallengeHandler.getProofCandidate(balanceTrackerContract, senderReceipts, challengedWallet, ct, id, stagedAmount)).to.eventually.be.fulfilled;
    });
  });
});
