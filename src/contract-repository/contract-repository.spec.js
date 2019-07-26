'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const nock = require('nock');

const metaServiceNocker = require('../cluster-information/meta-service-nocker');

describe ('contract-repository', () => {
  describe('given a ContractRepository', () => {
    let repository;
    let FakeNahmiiContract;

    beforeEach(() => {
      FakeNahmiiContract = proxyquire('./fake-nahmii-contract', {});
      nock.disableNetConnect();
      metaServiceNocker.resolveWithData(2);

      repository = proxyquire('./contract-repository', {
        '../nahmii-provider-factory': proxyquire('../nahmii-provider-factory/nahmii-provider-factory', {
          '../cluster-information': proxyquire('../cluster-information/cluster-information', {})
        }),
        'nahmii-sdk': { NahmiiContract: FakeNahmiiContract }
      });
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    describe('when a contract is acquired the first time', () => {
      it ('creates new contract', async () => {
        const contract = await repository.acquireContract('ClientFund');
        expect(contract).to.be.instanceOf(FakeNahmiiContract);
      });
    });

    describe('when the same contract is acquired a second time', () => {
      it ('acquires a cached contract', async () => {
        const contract1 = await repository.acquireContract('ClientFund');
        const contract2 = await repository.acquireContract('ClientFund');
        expect(Object.is(contract1, contract2)).to.be.true;
      });
    });

    describe('when it acquires an unknown contract', () => {
      it ('fails', async () => {
        return expect(repository.acquireContract('UnknownContract')).to.be.rejectedWith(/Failed to acquire contract/);
      });
    });

    describe('when it acquires an invalid contract', () => {
      it ('fails', async () => {
        return expect(repository.acquireContract('InvalidContract')).to.be.rejectedWith(/Failed to acquire contract/);
      });
    });
  });
});