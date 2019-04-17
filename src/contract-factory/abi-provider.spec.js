'use strict';

const chai = require('chai');
const expect = chai.expect;

const abiProvider = require('./abi-provider');

describe ('abi-provider', () => {
  describe ('Basic functionality working', () => {
    it ('locates ropsten abi', async () => {
      const path = abiProvider.getAbiPath('ClientFund', 'ropsten');
      return expect(path).to.equal('./node_modules/nahmii-contract-abstractions-ropsten/build/contracts/ClientFund.json');
    });

    it ('locates mainnet abi', () => {
      const path = abiProvider.getAbiPath('ClientFund', 'homestead');
      return expect(path).to.equal('./node_modules/nahmii-contract-abstractions/build/contracts/ClientFund.json');
    });

    it ('rejects unknown network name', async () => {
      return expect(
        () => abiProvider.getAbiPath('ClientFund', 'xxx')
      ).to.throw(/Failed to recognize network name/);
    });

    it ('rejects unknown contract name', () => {
      return expect(
        () => abiProvider.getAbiPath('xClientFund', 'homestead')
      ).to.throw(/Failed to find ABI for contract/);
    });
  });

  xdescribe ('Needed ABIs are available', () => {
    const neededContracts = [
      'ClientFund',
      'DriipSettlementChallengeByPayment',
      'NullSettlementChallengeByPayment',
      'BalanceTracker',
      'DriipSettlementDisputeByPayment',
      'NullSettlementDisputeByPayment'
    ];

    const neededNetworks = [
      'ropsten',
      'homestead'
    ];

    for (const network of neededNetworks) {
      for (const contract of neededContracts) {
        it (`${network} ${contract}`, () => {
          expect(() => abiProvider.getAbiPath(contract, network)).to.not.throw();
        });
      }
    }
  });
});

