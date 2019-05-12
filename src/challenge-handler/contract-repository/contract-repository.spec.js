'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const ethers = require('ethers');
const nock = require('nock');

const metaServiceNocker = require('../../cluster-information/meta-service-nocker');

class FakeContractFactory {
  static create (name, abi, walletOrProvider) {
    return {};
  }
}

describe ('contract-repository', () => {
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
      '../../contract-factory': proxyquire('../contract-factory/contract-factory', {
        '../cluster-information': proxyquire('../../cluster-information/cluster-information', {
          '../utils/nested-error': require('../../utils/nested-error')
        })
      }),
    });
    wallet = new ethers.Wallet('0x0123456789012345678901234567890123456789012345678901234567890123');
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('can acquire contracts', () => {
    it ('acquires new singleton contract', async () => {
      const contract = await repository.acquireContract('ClientFund');
      expect(contract).to.be.instanceOf(ethers.Contract);
      expect(contract.signer).to.be.equal(null);
    });

    it ('acquires cached singleton contract', async () => {
      const contract1 = await repository.acquireContract('ClientFund');
      const contract2 = await repository.acquireContract('ClientFund');
      expect(Object.is(contract1, contract2)).to.be.true;
    });

    it ('fails to acquire unknown contract', async () => {
      return expect(repository.acquireContract('xClientFund', wallet)).to.be.rejectedWith(/Failed to find contract address/);
    });
  });
});