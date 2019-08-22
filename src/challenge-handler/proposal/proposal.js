'use strict';

const NestedError = require('../../utils/nested-error');


const _contract = new WeakMap();
const _walletAddress = new WeakMap();
const _ct = new WeakMap();
const _id = new WeakMap();

async function hasProposal () {
  try {
    return await _contract.get(this).hasProposal(_walletAddress.get(this), _ct.get(this), _id.get(this));
  }
  catch (err) {
    throw new NestedError(err, 'Failed to check if proposal exists. ' + err.message);
  }
}

async function hasProposalTerminated () {
  try {
    return await _contract.get(this).hasProposalTerminated(_walletAddress.get(this), _ct.get(this), _id.get(this));
  }
  catch (err) {
    throw new NestedError(err, 'Failed to check if proposal has terminated. ' + err.message);
  }
}

async function hasProposalExpired () {
  try {
    return await _contract.get(this).hasProposalExpired(_walletAddress.get(this), _ct.get(this), _id.get(this));
  }
  catch (err) {
    throw new NestedError(err, 'Failed to check if proposal has expired. ' + err.message);
  }
}

const IsNotFound = Symbol('Proposal is not found.');
const IsTerminated = Symbol('Proposal has terminated.');
const IsExpired = Symbol('Proposal has expired.');
const IsChallengeable = Symbol('Proposal is challengeable.');

class Proposal {
  constructor (contract, walletAddress, ct, id) {
    _contract.set(this, contract);
    _walletAddress.set(this, walletAddress);
    _ct.set(this, ct);
    _id.set(this, id);
  }

  async getProposalState () {
    if (!await hasProposal.call(this))
      return IsNotFound;

    if (await hasProposalTerminated.call(this))
      return IsTerminated;

    if (await hasProposalExpired.call(this))
      return IsExpired;

    return IsChallengeable;
  }

  static getDescription (proposalState) {
    // See Symbol Description: https://itnext.io/status-of-javascript-ecmascript-2019-beyond-5efca6a2d233
    return proposalState.toString().replace('Symbol(', '').replace(')', '');
  }
}

Proposal.IsNotFound = IsNotFound;
Proposal.IsTerminated = IsTerminated;
Proposal.IsExpired = IsExpired;
Proposal.IsChallengeable = IsChallengeable;

module.exports = Proposal;
