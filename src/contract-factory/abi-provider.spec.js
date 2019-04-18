'use strict';

const chai = require('chai');
const expect = chai.expect;

const abiProvider = require('./abi-provider');

describe ('abi-provider', () => {
  describe ('Can compose abi path', () => {
    it ('for ropsten', async () => {
      const path = abiProvider.getAbiPath('ClientFund', 'ropsten');
      return expect(path).to.equal('nahmii-contract-abstractions-ropsten/build/contracts/ClientFund.json');
    });

    it ('for mainnet', () => {
      const path = abiProvider.getAbiPath('ClientFund', 'homestead');
      return expect(path).to.equal('nahmii-contract-abstractions/build/contracts/ClientFund.json');
    });

    it ('not for unknown network', () => {
      return expect(
        () => abiProvider.getAbiPath('ClientFund', 'xhomestead')
      ).to.throw(/Failed to recognize network name/);
    });
  });

  describe ('Contract abstractions has needed APIs', () => {
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
        it (`for ${network} ${contract}`, () => {
          expect(() => abiProvider.getAbiInfo(contract, network)).to.not.throw();
        });
      }
    }

    it ('but not for unknown contract', async () => {
      return expect(
        () => abiProvider.getAbiInfo('xClientFund', 'ropsten')
      ).to.throw(/Cannot find module/);
    });
  });
});

