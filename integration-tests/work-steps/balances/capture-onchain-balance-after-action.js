'use strict';

const assert = require('assert');

module.exports = async function (ctx, walletName, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  require('./capture-onchain-balance')(ctx, `Capture ${walletName}'s on-chain ${symbol} balance after action`, walletName, `onchainBalanceAfterAction`, symbol);
};
