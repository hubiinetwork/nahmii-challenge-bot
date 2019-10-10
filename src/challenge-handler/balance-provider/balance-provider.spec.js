'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const balances = require('./balance-provider');
const ethers = require('ethers');
const { EthereumAddress } = require('nahmii-ethereum-address');

const balanceTrackerContractMock = {
  activeBalanceTypes: sinon.stub(),
  get: sinon.stub(),
  fungibleRecordByBlockNumber: sinon.stub()
};

const bnZero = ethers.utils.bigNumberify(0);
const address = EthereumAddress.from('0x54a27640b402cb7ca097c31cbf57ff23ea417026');
const ct = EthereumAddress.from('0x0000000000000000000000000000000000000000');
const id = bnZero;
const blockNo = 0;

describe('balance-provider', () => {
  beforeEach (() => {
    balanceTrackerContractMock.get.reset();
    balanceTrackerContractMock.fungibleRecordByBlockNumber.reset();
    balanceTrackerContractMock.activeBalanceTypes.reset();

    balanceTrackerContractMock.activeBalanceTypes.returns(Promise.resolve([
      '0xb813b2537a176df7231d1715fbcd8fb847032c45ba860572b1abb88bf4ec2d0e',
      '0x2481b1d2de4705a3d6f16fcad41f3da3d5cea523dcc13e7e981eacc3bb0569dd'
    ]));
  });

  describe('given a balance provider', () => {
    describe('when active balances is retrieved for a wallet', () => {
      it('returns active balance when backend works', async function () {
        balanceTrackerContractMock.get.returns(Promise.resolve(bnZero));
        const promisedBalance = balances.getActiveBalance(balanceTrackerContractMock, address, ct, id).then(res => res.toString());
        return expect(promisedBalance).to.eventually.be.fulfilled.and.equal('0');
      });

      it('failes when getter fails', async function () {
        balanceTrackerContractMock.get.rejects(new Error(''));
        const promisedBalance = balances.getActiveBalance(balanceTrackerContractMock, address, ct, id).then(res => res.toString());
        return expect(promisedBalance).to.eventually.be.rejected;
      });

      it('failes when balance types fail', async function () {
        balanceTrackerContractMock.activeBalanceTypes.rejects(new Error(''));
        const promisedBalance = balances.getActiveBalance(balanceTrackerContractMock, address, ct, id).then(res => res.toString());
        return expect(promisedBalance).to.eventually.be.rejected;
      });
    });
  })

  describe('when active balances is retrieved for a block number', () => {
    it('returns active balanceat block when backend works', async function () {
      balanceTrackerContractMock.fungibleRecordByBlockNumber.returns(Promise.resolve({ amount: bnZero }));
      const promisedBalance = balances.getActiveBalanceAtBlock(balanceTrackerContractMock, address, ct, id, blockNo).then(res => res.toString());
      return expect(promisedBalance).to.eventually.be.fulfilled.and.equal('0');
    });

    it('failes when getter fails', async function () {
      balanceTrackerContractMock.fungibleRecordByBlockNumber.rejects(new Error(''));
      const promisedBalance = balances.getActiveBalanceAtBlock(balanceTrackerContractMock, address, ct, id, blockNo).then(res => res.toString());
      return expect(promisedBalance).to.eventually.be.rejected;
    });

    it('failes when balance types fail', async function () {
      balanceTrackerContractMock.activeBalanceTypes.rejects(new Error(''));
      const promisedBalance = balances.getActiveBalanceAtBlock(balanceTrackerContractMock, address, ct, id, blockNo).then(res => res.toString());
      return expect(promisedBalance).to.eventually.be.rejected;
    });
  });
});
