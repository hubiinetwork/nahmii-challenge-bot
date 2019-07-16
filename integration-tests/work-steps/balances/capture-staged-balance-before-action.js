'use strict';

const assert = require('assert');

module.exports = function (ctx, walletName, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  require('./capture-staged-balance')(ctx, `Capture ${walletName}'s staged balance before action`, walletName, 'stagedBalanceBeforeAction', symbol);
};
