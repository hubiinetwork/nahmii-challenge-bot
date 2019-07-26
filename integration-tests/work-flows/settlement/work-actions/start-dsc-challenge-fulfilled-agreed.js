'use strict';
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, paymentName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof paymentName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  // Event
  require('../work-steps/challenger/subscribe-dsc-start-callback')(ctx, challengerName);

  // Balances
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  // Proposals
  require('../work-steps/proposals/has-no-dsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-dsc-proposal-nonce')(ctx, walletName, symbol);

  // Action
//  require('../work-steps/settlement/settlement-start-challenge-qualified')(ctx, walletName, stageAmount, symbol, 'payment-driip');

  require('../../../work-steps/contracts/DriipSettlementChallenge/startChallengeFromPayment-to-be-fulfilled')(ctx, walletName, paymentName, stageAmount, symbol);

  // Proposals
  require('../work-steps/proposals/has-dsc-proposal-status-qualified')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-dsc-proposal-nonce')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-dsc-proposal-staged-amount')(ctx, walletName, stageAmount, symbol);

  // Event
  require('../work-steps/challenger/validate-dsc-start-callback')(ctx, challengerName, walletName, stageAmount, symbol);

  // Balances
  require('../../../work-steps/balances/ensure-nahmii-balance-updates')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '-' + stageAmount, symbol);
  require('../../../work-steps/balances/verify-staged-balance-change')(ctx, walletName, '0.0', symbol);

};
