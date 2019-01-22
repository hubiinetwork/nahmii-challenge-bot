'use strict';

const config = require('../config-service/config');
const { logger } = require('@hubiinetwork/logger');
const nahmii = require('nahmii-sdk');
const NestedError = require('../utils/nested-error');
const { acquireNahmiiProvider } = require('./nahmii-provider');

async function getBalance (address, ct) {
  try {
    const nahmiiPrv = await acquireNahmiiProvider();
    const balances = await nahmiiPrv.getNahmiiBalances(address);
    const balance = balances.find(balance => balance.currency.ct === ct);

    return balance ? balance.amount : '0';
  }
  catch (err) {
    throw new NestedError(err, `Failed to get currency balance: ${err.message}`);
  }
}

async function getReceipts (wallet) {
  try {
    const nahmiiPrv = await acquireNahmiiProvider();
    return await nahmiiPrv.getWalletReceipts(wallet);
  }
  catch (err) {
    throw new NestedError(err, `Failed to retrieve receipts: ${err.message}`);
  }
}

module.exports = {
  getBalance,
  getReceipts
};
