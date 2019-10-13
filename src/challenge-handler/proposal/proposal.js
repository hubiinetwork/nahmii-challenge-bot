'use strict';

const t = require('../../runtime-types');
const NestedError = require('../../utils/nested-error');


const _contract = new WeakMap();
const _address = new WeakMap();
const _ct = new WeakMap();
const _id = new WeakMap();

async function hasProposal () {
  try {
    return await _contract.get(this).hasProposal(_address.get(this).toString(), _ct.get(this).toString(), _id.get(this));
  }
  catch (err) {
    throw new NestedError(err, 'Failed to check if proposal exists. ' + err.message);
  }
}

async function hasProposalTerminated () {
  try {
    return await _contract.get(this).hasProposalTerminated(_address.get(this).toString(), _ct.get(this).toString(), _id.get(this));
  }
  catch (err) {
    throw new NestedError(err, 'Failed to check if proposal has terminated. ' + err.message);
  }
}

async function hasProposalExpired () {
  try {
    return await _contract.get(this).hasProposalExpired(_address.get(this).toString(), _ct.get(this).toString(), _id.get(this));
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
  constructor (contract, address, ct, id) {
    t.EthereumAddress().assert(address);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    _contract.set(this, contract);
    _address.set(this, address);
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

  async getProposalExpirationTime () {
    try {
      return await _contract.get(this).proposalExpirationTime(_address.get(this).toString(), _ct.get(this).toString(), _id.get(this));
    }
    catch (err) {
      throw new NestedError(err, 'Failed to get proposal expiration time. ' + err.message);
    }
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
