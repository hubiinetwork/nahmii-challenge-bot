'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const ethersMock = {
  Contract: class Contract {
    constructor(address, abi, provider) {
      this.address = address;
      this.abi = abi;
      this.provider = provider;
    }
  }
};

const providerMock = {
  network: {
    chainId: 3
  }
};

let abiInfoMock = {};

const abiProviderMock = {
  getAbiInfo: () => abiInfoMock
};

const ethereumMock = {
  contracts: {
    ClientFund: ''
  },
  net: 'ropsten'
};

const clusterInformationMock = {
  getEthereum: async () => ethereumMock
};

const loggerMock = {
  logger: {
    info: sinon.stub()
  }
};

const ContractFactory = proxyquire('./contract-factory', {
  'ethers': ethersMock,
  '../cluster-information': clusterInformationMock,
  './abi-provider': abiProviderMock,
  '@hubiinetwork/logger': loggerMock
});

describe ('contract-factory', () => {
  let old_node_env;

  before(() => {
    old_node_env = process.env.NODE_ENV;
  });

  beforeEach(() => {
    abiInfoMock = {
      networks: {
        '3': {
          address: '0xcaf8bf7c0aab416dde4fe3c20c173e92afff8d72'
        }
      },
      abi: 'mockAbi'
    };
    ethereumMock.contracts.ClientFund = '0xcaf8bf7c0aab416dde4fe3c20c173e92afff8d72';
    loggerMock.logger.info.reset();
  });

  afterEach(() => {
    process.env.NODE_ENV = old_node_env;
  });

  describe ('Creates contracts', () => {
    it('when known contract', async () => {
      const contract = await ContractFactory.create('ClientFund', providerMock);
      expect(contract.address).to.equal(ethereumMock.contracts.ClientFund);
      expect(contract.abi).to.equal('mockAbi');
      return contract;
    });

    it('not if contract unknown', async () => {
      return expect(ContractFactory.create('xClientFund', providerMock)).to.be.rejectedWith(/Failed to find contract/);
    });

    it('not if abi info has incomplete info', async () => {
      abiInfoMock = {};
      return expect(ContractFactory.create('ClientFund', providerMock)).to.be.rejectedWith(/Failed to find property 'networks' in abi info/);
    });
  });

  describe ('Warns about address mismatch', () => {
    it('throws in production', async () => {
      process.env.NODE_ENV = 'production';
      abiInfoMock.networks[3].address = '0xbaf8bf7c0aab416dde4fe3c20c173e92afff8d72';
      return expect(ContractFactory.create('ClientFund', providerMock)).to.be.rejectedWith(/Contract addresses do not match/);
    });

    it('logs in development', async () => {
      delete(process.env.NODE_ENV);
      abiInfoMock.networks[3].address = '0xbaf8bf7c0aab416dde4fe3c20c173e92afff8d72';
      await ContractFactory.create('ClientFund', providerMock);
      expect(loggerMock.logger.info.callCount).to.be.equal(1);
    });
  });
});
