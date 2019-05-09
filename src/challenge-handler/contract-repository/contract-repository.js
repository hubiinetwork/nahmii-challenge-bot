'use strict';

const ContractFactory = require('../../contract-factory');
const NestedError = require('../../utils/nested-error');
const NahmiiProviderFactory = require('../../nahmii-provider-factory');

const _contracts = {};

class ContractRepository {
  static async acquireContract (contractName, optionalWallet) {
    try {
      if (!_contracts[contractName]) {
        const provider = await NahmiiProviderFactory.acquireProvider();
        _contracts[contractName] = await ContractFactory.create(contractName, provider);
      }

      const contract = _contracts[contractName];

      if(optionalWallet)
        return contract.connect(optionalWallet);
      else
        return contract;
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
