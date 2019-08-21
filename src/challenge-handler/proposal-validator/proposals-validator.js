'use strict';

const contracts = require('../../contract-repository');
const NestedError = require('../../utils/nested-error');

class ProposalsValidator {
  static async hasProposal (contract, initiator, ct, id) {
    try {
      return await contract.hasProposal(initiator, ct, id);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to check if proposal exists. ' + err.message);
    }
  }

  static async hasProposalTerminated (contract, initiator, ct, id) {
    try {
      return await contract.hasProposalTerminated(initiator, ct, id);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to check if proposal has terminated. ' + err.message);
    }
  }

  static async hasProposalExpired (contract, initiator, ct, id) {
    try {
      return await contract.hasProposalExpired(initiator, ct, id);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to check if proposal has expired. ' + err.message);
    }
  }

  static async validateContractProposal (contract, initiator, ct, id) {
    if (!await ProposalsValidator.hasProposal(contract, initiator, ct, id))
      return { isChallengeable: false, message: 'Proposal is not found.'};

    if (await ProposalsValidator.hasProposalTerminated(contract, initiator, ct, id))
      return { isChallengeable: false, message: 'Proposal has terminated.'};

    if (await ProposalsValidator.hasProposalExpired(contract, initiator, ct, id))
      return { isChallengeable: false, message: 'Proposal has expired.'};

    return { isChallengeable: true, message: 'Ok.'};
  }

  static async validateDSCProposal (initiator, ct, id) {
    const contract = await contracts.getDriipSettlementChallengeByPayment();
    return ProposalsValidator.validateContractProposal(contract, initiator, ct, id);
  }

  static async validateNSCProposal (initiator, ct, id) {
    const contract = await contracts.getNullSettlementChallengeByPayment();
    return ProposalsValidator.validateContractProposal(contract, initiator, ct, id);
  }
}

module.exports = ProposalsValidator;
