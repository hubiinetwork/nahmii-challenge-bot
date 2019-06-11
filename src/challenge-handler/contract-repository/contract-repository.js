'use strict';

const NestedError = require('../../utils/nested-error');
const NahmiiProviderFactory = require('../../nahmii-provider-factory');
const nahmii = require('nahmii-sdk');

const _contracts = {};

class ContractRepository {
  static async acquireContract (contractName) {
    try {
      if (!_contracts[contractName]) {
        const provider = await NahmiiProviderFactory.acquireProvider();
        _contracts[contractName] = new nahmii.NahmiiContract(contractName, provider);

        if (!_contracts[contractName].validate())
          throw Error('Failed to validate contract.');
      }

      return _contracts[contractName];
    }
    catch (err) {
      throw new NestedError(err, 'Failed to acquire contract. ' + err.message);
    }
  }

  static getClientFund () {
    return ContractRepository.acquireContract('ClientFund');
  }

  static getDriipSettlementChallengeByPayment () {
    return ContractRepository.acquireContract('DriipSettlementChallengeByPayment');
  }

  static getNullSettlementChallengeByPayment () {
    return ContractRepository.acquireContract('NullSettlementChallengeByPayment');
  }

  static getBalanceTracker () {
    return ContractRepository.acquireContract('BalanceTracker');
  }

  static getDriipSettlementDisputeByPayment () {
    return ContractRepository.acquireContract('DriipSettlementDisputeByPayment');
  }

  static getNullSettlementDisputeByPayment () {
    return ContractRepository.acquireContract('NullSettlementDisputeByPayment');
  }
}

module.exports = ContractRepository;
