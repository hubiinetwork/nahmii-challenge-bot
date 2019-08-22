'use strict';

const Proposal = require('./proposal');

const FakeContractRepository = require('../../contract-repository/fake-contract-repository');

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

const given = describe;
const when = describe;

describe('proposal', () => {
  let contract, walletAddr, ct, id;
  let proposal;

  beforeEach(async () => {
    ct = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
    id = 0;
  });

  afterEach(() => {
    FakeContractRepository.reset();
  });

  given('a Proposal constructor', () => {
    when('constructing a DSC proposal', () => {
      beforeEach(async () => {
        contract = await FakeContractRepository.getDriipSettlementChallengeByPayment();
        proposal = new Proposal(contract, walletAddr, ct, id);
      });

      it('succeeds on valid input', async () => {
        expect(proposal).to.be.instanceOf(Proposal);
      });
    });

    when('constructing a NSC proposal', () => {
      beforeEach(async () => {
        contract = await FakeContractRepository.getNullSettlementChallengeByPayment();
        proposal = new Proposal(contract, walletAddr, ct, id);
      });

      it('succeeds on valid input', async () => {
        expect(proposal).to.be.instanceOf(Proposal);
      });
    });
  });

  function itIdentifiesProposalState () {
    it('identifies challengeable state', () => {
      return expect(proposal.getProposalState()).to.eventually.eql(Proposal.IsChallengeable);
    });

    it('identifies existence state', () => {
      contract.hasProposal.returns(false);
      return expect(proposal.getProposalState()).to.eventually.equal(Proposal.IsNotFound);
    });

    it('identifies expiration state', () => {
      contract.hasProposalExpired.returns(true);
      return expect(proposal.getProposalState()).to.eventually.equal(Proposal.IsExpired);
    });

    it('identifies termination state', () => {
      contract.hasProposalTerminated.returns(true);
      return expect(proposal.getProposalState()).to.eventually.equal(Proposal.IsTerminated);
    });

    it ('fails if contract throws on existence state', () => {
      contract.hasProposal.throws(new Error('hasProposal failed'));
      return expect(proposal.getProposalState()).to.eventually.be.rejectedWith(/Failed to check if proposal exists/);
    });

    it ('fails if contract throws on termination state', () => {
      contract.hasProposalTerminated.throws(new Error('hasProposalTerminated failed'));
      return expect(proposal.getProposalState()).to.eventually.be.rejectedWith(/Failed to check if proposal has terminated/);
    });

    it ('fails if contract throws on expiration state', () => {
      contract.hasProposalExpired.throws(new Error('hasProposalExpired failed'));
      return expect(proposal.getProposalState()).to.eventually.be.rejectedWith(/Failed to check if proposal has expired/);
    });
  }

  given('a DSC Proposal', () => {
    beforeEach(async () => {
      contract = await FakeContractRepository.getDriipSettlementChallengeByPayment();
      proposal = await new Proposal(contract, walletAddr, ct, id);
    });

    when('computing proposal state', () => {
      itIdentifiesProposalState();
    });
  });

  given('a NSC Proposal', () => {
    beforeEach(async () => {
      contract = await FakeContractRepository.getDriipSettlementChallengeByPayment();
      proposal = await new Proposal(contract, walletAddr, ct, id);
    });

    when('computing proposal state', () => {
      itIdentifiesProposalState();
    });
  });

  given('a proposal state', () => {
    when('a description is requested', () => {
      [
        { state: Proposal.IsChallengeable, stateName: 'IsChallengeable', description: 'Proposal is challengeable.' },
        { state: Proposal.IsNotFound, stateName: 'IsNotFound', description: 'Proposal is not found.' },
        { state: Proposal.IsTerminated, stateName: 'IsTerminated', description: 'Proposal has terminated.' },
        { state: Proposal.IsExpired, stateName: 'IsExpired', description: 'Proposal has expired.' }
      ].forEach(scenario => {
        it (`returns a description for ${scenario.stateName}`, () => {
          expect(Proposal.getDescription(scenario.state)).to.equal(scenario.description);
        });
      });
    });
  });
});
