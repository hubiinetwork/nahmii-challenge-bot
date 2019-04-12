'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const ethers = require('ethers');
const fs = require('fs');

const ChallengeHandler = false ? require('./challenge-handler') :
proxyquire('./challenge-handler', {
  '@hubiinetwork/logger': { logger: { info: () => {} }}
});

const eawJson = fs.readFileSync('./src/challenge-handler/receipts.spec.data.json', 'utf8');
const receipts = JSON.parse(eawJson);
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

class ContractMock {
  constructor () {
    this.callbacks = {};
  }
  on (eventName, cb) {
    this.callbacks[eventName] = cb;
  }
  emitEvent(eventName, ...args) {
    this.callbacks[eventName](...args);
  }
  connect () {
    return this;
  }
}

class ClientFundContract extends ContractMock {

}

class DriipSettlementChallengeByPaymentContract extends ContractMock {
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

class NullSettlementChallengeByPaymentContract extends ContractMock {
  emitStartChallengeEvent (...args) {
    super.emitEvent('StartChallengeEvent', ...args);
  }
}

class BalanceTrackerContract extends ContractMock {
  constructor () {
    super();
    this.activeBalanceTypes = sinon.stub();
    this.get = sinon.stub();
    this.fungibleRecordByBlockNumber = sinon.stub();
  }
}

class DriipSettlementDisputeByPaymentContract extends ContractMock {

}

class NullSettlementDisputeByPaymentContract extends ContractMock {

}

describe('ChallengeHandler', () => {
  let clientFundContract;
  let driipSettlementChallengeByPaymentContract, nullSettlementChallengeByPaymentContract;
  let balanceTrackerContract;
  let driipSettlementDisputeByPaymentContract, nullSettlementDisputeByPaymentContract;
  let handler;

  beforeEach(() => {
    clientFundContract = new ClientFundContract();
    driipSettlementChallengeByPaymentContract = new DriipSettlementChallengeByPaymentContract();
    nullSettlementChallengeByPaymentContract = new NullSettlementChallengeByPaymentContract();
    balanceTrackerContract = new BalanceTrackerContract();
    driipSettlementDisputeByPaymentContract = new DriipSettlementDisputeByPaymentContract();
    nullSettlementDisputeByPaymentContract = new NullSettlementDisputeByPaymentContract();

    handler = new ChallengeHandler (
      walletMock, gasLimit,
      clientFundContract,
      driipSettlementChallengeByPaymentContract, nullSettlementChallengeByPaymentContract,
      balanceTrackerContract,
      driipSettlementDisputeByPaymentContract, nullSettlementDisputeByPaymentContract
    );

    walletMock.provider.getWalletReceipts.returns(receipts);

    balanceTrackerContract.activeBalanceTypes.returns(Promise.resolve([
      '0xb813b2537a176df7231d1715fbcd8fb847032c45ba860572b1abb88bf4ec2d0e',
      '0x2481b1d2de4705a3d6f16fcad41f3da3d5cea523dcc13e7e981eacc3bb0569dd'
    ]));
    balanceTrackerContract.get.returns(Promise.resolve(bnZero));
    balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
  });

  describe ('Call callbacks on important operation events', function () {
    const wallet = sender;
    const nonce = 3;
    const cumulativeTransferAmount = null;
    const stageAmount = ethers.utils.parseEther('5');
    const targetBalanceAmount = null;

    it('onDSCStart', async function () {
      const promisedCallback = new Promise(resolved => handler.onDSCStart(resolved));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onDSCAgreed', async function () {
      const promisedCallback = new Promise(resolved => handler.onDSCAgreed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onDSCDisputed', async function () {
      const promisedCallback = new Promise(resolved => handler.onDSCDisputed(resolved));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      driipSettlementChallengeByPaymentContract.emitStartChallengeFromPaymentEvent(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCStart', async function () {
      const promisedCallback = new Promise(resolved => handler.onNSCStart(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });

    it('onNSCAgreed', async function () {
      const promisedCallback = new Promise(resolved => handler.onNSCAgreed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });
/*
    it('onNSCDisputed', async function () {
      const promisedCallback = new Promise(resolved => handler.onNSCDisputed(resolved));
      balanceTrackerContract.get.returns(Promise.resolve(ethers.utils.parseEther('10')));
      balanceTrackerContract.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      nullSettlementChallengeByPaymentContract.emitStartChallengeEvent(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
      return expect(promisedCallback).to.eventually.be.fulfilled;
    });
*/
  });
});
