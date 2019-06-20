'use strict';

const NestedError = require('../../utils/nested-error');
const NahmiiProviderFactory = require('../../nahmii-provider-factory');
const nahmii = require('nahmii-sdk');
const { logger } = require('@hubiinetwork/logger');

const _contracts = {};

class ContractRepository {
  static async acquireContract (contractName) {
    try {
      if (!_contracts[contractName]) {
        const provider = await NahmiiProviderFactory.acquireProvider();
        _contracts[contractName] = new nahmii.NahmiiContract(contractName, provider);

        logger.info(`Aquired: '${contractName}', '${_contracts[contractName].address}'`);

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
}

module.exports = ContractRepository;
