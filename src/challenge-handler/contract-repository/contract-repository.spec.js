'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const nock = require('nock');

const metaServiceNocker = require('../../cluster-information/meta-service-nocker');

class FakeNahmiiContract {
  constructor(contractName, _walletOrProvider) {
    this.contractName = contractName;
    if (/^x/.test(contractName))
      throw Error('Fake failure in FakeNahmiiContract constructor');
  }
}

const fakeNahmiiSdk = {
  NahmiiContract: FakeNahmiiContract
};

describe ('contract-repository', () => {
  describe('given a ContractRepository', () => {
    let repository;
    let wallet;

    beforeEach(() => {
      nock.disableNetConnect();
      metaServiceNocker.resolveWithData(2);
      repository = proxyquire('./contract-repository', {
        '../../nahmii-provider-factory': proxyquire('../../nahmii-provider-factory/nahmii-provider-factory', {
          '../cluster-information': proxyquire('../../cluster-information/cluster-information', {
            '../utils/nested-error': require('../../utils/nested-error')
          })
        }),
        'nahmii-sdk': fakeNahmiiSdk
      });
      wallet = new ethers.Wallet('0x0123456789012345678901234567890123456789012345678901234567890123');
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    describe('acquires a contract the first time', () => {
      it ('creates new contract', async () => {
        const contract = await repository.acquireContract('ClientFund');
        expect(contract).to.be.instanceOf(FakeNahmiiContract);
      });
    });

    describe('acquires the same contract a second time', () => {
      it ('acquires a cached contract', async () => {
        const contract1 = await repository.acquireContract('ClientFund');
        const contract2 = await repository.acquireContract('ClientFund');
        expect(Object.is(contract1, contract2)).to.be.true;
      });
    });

    describe('acquires an unknown contract', () => {
      it ('fails', async () => {
        return expect(repository.acquireContract('xClientFund', wallet)).to.be.rejectedWith(/Failed to acquire contract/);
      });
    });
  });
});