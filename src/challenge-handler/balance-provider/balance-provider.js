'use strict';

const t = require('../../runtime-types');
const NestedError = require('../../utils/nested-error');
const ethers = require('ethers');
const { bigNumberify } = ethers.utils;

async function getActiveBalanceTypes (balanceTrackerContract) {
  try {
    return await balanceTrackerContract.activeBalanceTypes();
  } catch (err) {
    throw new NestedError(err, 'Failed to get active balance types. ' + err.message);
  }
}

async function getActiveBalance (balanceTrackerContract, address, ct, id) {
  t.EthereumAddress().assert(address);
  t.EthereumAddress().assert(ct);
  t.EthersBigNumber().assert(id);

  const balanceTypes = await getActiveBalanceTypes(balanceTrackerContract);
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    try {
      const balance = await balanceTrackerContract.get(address.toString(), balanceTypes[i], ct.toString(), id);
      activeBalance = activeBalance.add(balance);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to get balance. ' + err.message);
    }
  }

  return activeBalance;
}

async function getActiveBalanceAtBlock (balanceTrackerContract, address, ct, id, blockNo) {
  t.EthereumAddress().assert(address);
  t.EthereumAddress().assert(ct);
  t.EthersBigNumber().assert(id);
  t.uint().assert(blockNo);

  const balanceTypes = await getActiveBalanceTypes(balanceTrackerContract);
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    try {
      const { amount } = await balanceTrackerContract.fungibleRecordByBlockNumber(address.toString(), balanceTypes[i], ct.toString(), id, blockNo);
      activeBalance = activeBalance.add(amount);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to get tracker record. ' + err.message);
    }
  }

  return activeBalance;
}

module.exports = {
  getActiveBalance,
  getActiveBalanceAtBlock
};