'use strict';

const t = require('../../../runtime-types');
const contracts = require('../../../contract-repository');
const Proposal = require('../../proposal');

async function handleEvent(initiator, ct, id, callback, ...args) {
  await callback(...args);

  const proposal = new Proposal(await contracts.getDriipSettlementChallengeByPayment(), initiator, ct, id);
  const timeToExpiry = proposal.getProposalExpirationTime() - Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const timeout = Math.max(0, timeToExpiry - fiveMinutes);

  setTimeout(() => callback(...args), timeout);
}

async function handleDSCStart (initiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, callback) {
  t.EthereumAddress().assert(initiator);
  t.EthersBigNumber().assert(nonce);
  t.EthersBigNumber().assert(cumulativeTransferAmount);
  t.EthersBigNumber().assert(stageAmount);
  t.EthersBigNumber().assert(targetBalanceAmount);
  t.EthereumAddress().assert(ct);
  t.EthersBigNumber().assert(id);

  handleEvent(initiator, ct, id, callback, initiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
}

async function handleNSCStart(initiator, nonce, stageAmount, targetBalanceAmount, ct, id, callback) {
  t.EthereumAddress().assert(initiator);
  t.EthersBigNumber().assert(nonce);
  t.EthersBigNumber().assert(stageAmount);
  t.EthersBigNumber().assert(targetBalanceAmount);
  t.EthereumAddress().assert(ct);
  t.EthersBigNumber().assert(id);

  handleEvent(initiator, ct, id, callback, initiator, nonce, stageAmount, targetBalanceAmount, ct, id);
}

module.exports = {
  handleDSCStart,
  handleNSCStart
};
