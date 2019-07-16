'use strict';

const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  // Balances
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  // Proposals
  require('../work-steps/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  // Action
  require('../../../work-steps/contracts/NullSettlementChallenge/startChallenge-to-be-rejected')(ctx, walletName, stageAmount, symbol);

  // Proposals
  require('../work-steps/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  // Balances
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '0.0', symbol);
  require('../../../work-steps/balances/verify-staged-balance-change')(ctx, walletName, '0.0', symbol);
};
