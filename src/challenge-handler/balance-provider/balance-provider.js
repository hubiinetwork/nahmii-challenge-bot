'use strict';

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
  const balanceTypes = await getActiveBalanceTypes(balanceTrackerContract);
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    try {
      const balance = await balanceTrackerContract.get(address, balanceTypes[i], ct, bigNumberify(id));
      activeBalance = activeBalance.add(balance);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to get balance. ' + err.message);
    };
  }

  return activeBalance;
}

async function getActiveBalanceAtBlock (balanceTrackerContract, address, ct, id, blockNo) {
  const balanceTypes = await getActiveBalanceTypes(balanceTrackerContract);
  let activeBalance = bigNumberify(0);

  for (let i = 0; i < balanceTypes.length; ++i) {
    try {
      const { amount } = await balanceTrackerContract.fungibleRecordByBlockNumber(address, balanceTypes[i], ct, id, blockNo);
      activeBalance = activeBalance.add(amount);
    }
    catch (err) {
      throw new NestedError(err, 'Failed to get tracker record. ' + err.message);
    };
  }

  return activeBalance;
}

module.exports = {
  getActiveBalance,
  getActiveBalanceAtBlock
};