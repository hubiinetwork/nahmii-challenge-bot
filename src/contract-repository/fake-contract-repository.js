'use strict';


const FakeNahmiiContract = require('./fake-nahmii-contract');

const _fakeContracts = [];

class FakeContractRepository {

  static async acquireContract (contractName) {
    let fakeContract =_fakeContracts.find(c => c.contractName === contractName);

    if (!fakeContract) {
      fakeContract = new FakeNahmiiContract(contractName);
      _fakeContracts.push(fakeContract);
    }

    return fakeContract;
  }

  static tryGetContractFromAddress (address) {
    return _fakeContracts.find(c => c.address === address);
  }

  static getClientFund () {
    return FakeContractRepository.acquireContract('ClientFund');
  }

  static getDriipSettlementChallengeByPayment () {
    return FakeContractRepository.acquireContract('DriipSettlementChallengeByPayment');
  }

  static getNullSettlementChallengeByPayment () {
    return FakeContractRepository.acquireContract('NullSettlementChallengeByPayment');
  }

  static getBalanceTracker () {
    return FakeContractRepository.acquireContract('BalanceTracker');
  }

  static reset () {
    // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
    _fakeContracts.length = 0;
  }
}


module.exports = FakeContractRepository;
