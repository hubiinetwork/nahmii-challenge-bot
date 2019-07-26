'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const nock = require('nock');
const MetaServiceNocker = require('../../cluster-information/meta-service-nocker');


const FakeNahmiiContract = require('../../contract-repository/fake-nahmii-contract');

const fakeNahmiiSdk = {
  NahmiiContract: FakeNahmiiContract
};

function proxyquireStubbedContractRepositoryModule () {
  return proxyquire('../../contract-repository/contract-repository', {
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
/*
describe('challenge-handler-factory', () => {
  let stubbedContractRepository;
  let fakeChallengeHandler;
  let StubbedChallengeHandlerFactory;
  const fakeWallet = {};
  const gasLimit = ethers.utils.bigNumberify(0);

  beforeEach(async () => {
    nock.disableNetConnect();
    MetaServiceNocker.resolveWithData();

    stubbedContractRepository = new proxyquireStubbedContractRepositoryModule();

    StubbedChallengeHandlerFactory = proxyquire('./challenge-handler-factory', {
      '../challenge-handler': FakeChallengeHandler,
      '../contract-repository': stubbedContractRepository
    });

    fakeChallengeHandler = await StubbedChallengeHandlerFactory.create(fakeWallet, gasLimit);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('given a ChallengeHandlerFactory', () => {
    describe('when it builds a ChallengeHandler', () => {
      it ('connects StartChallengeFromPaymentEvent to #handleDSCStart()', async function () {
        (await stubbedContractRepository.getDriipSettlementChallengeByPayment()).emit('StartChallengeFromPaymentEvent', 'ok');
        expect(fakeChallengeHandler.handleDSCStart.calledOnceWith('ok')).to.be.true;
      });

      it ('connects StartChallengeFromPaymentByProxyEvent to #handleDSCStart()', async function () {
        (await stubbedContractRepository.getDriipSettlementChallengeByPayment()).emit('StartChallengeFromPaymentByProxyEvent', 'ok');
        expect(fakeChallengeHandler.handleDSCStart.calledOnceWith('ok')).to.be.true;
      });

      it ('connects ChallengeByPaymentEvent to #handleWalletLocked()', async function () {
        (await stubbedContractRepository.getDriipSettlementChallengeByPayment()).emit('ChallengeByPaymentEvent', 'ok');
        expect(fakeChallengeHandler.handleWalletLocked.calledOnceWith('DSC Locked', 'ok')).to.be.true;
      });

      it ('connects StartChallengeEvent to #handleNSCStart()', async function () {
        (await stubbedContractRepository.getNullSettlementChallengeByPayment()).emit('StartChallengeEvent', 'ok');
        expect(fakeChallengeHandler.handleNSCStart.calledOnceWith('ok')).to.be.true;
      });

      it ('connects StartChallengeByProxyEvent to #handleNSCStart()', async function () {
        (await stubbedContractRepository.getNullSettlementChallengeByPayment()).emit('StartChallengeByProxyEvent', 'ok');
        expect(fakeChallengeHandler.handleNSCStart.calledOnceWith('ok')).to.be.true;
      });

      it ('connects ChallengeByPaymentEvent to #handleWalletLocked()', async function () {
        (await stubbedContractRepository.getNullSettlementChallengeByPayment()).emit('ChallengeByPaymentEvent', 'ok');
        expect(fakeChallengeHandler.handleWalletLocked.calledOnceWith('NSC Locked', 'ok')).to.be.true;
      });

      it ('connects SeizeBalancesEvent to #handleBalancesSeized()', async function () {
        (await stubbedContractRepository.getClientFund()).emit('SeizeBalancesEvent', 'ok');
        expect(fakeChallengeHandler.handleBalancesSeized.calledOnceWith('ok')).to.be.true;
      });
    });
  });

  describe('given a ChallengeHandlerFactory', () => {
    describe('when initialization of event handlers throws', () => {
      it ('re-throws by a nested exception', async function () {
        sinon.stub(await stubbedContractRepository.getClientFund(), 'on').throws(new Error('failure'));
        return expect(StubbedChallengeHandlerFactory.create(fakeWallet, gasLimit)).to.eventually.be.rejectedWith(/Failed to initialize contract event handlers/);
      });
    });
  });
});
*/
