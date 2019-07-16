'use strict';

const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, receiptName, stageAmount, symbol) {
  assert(typeof ctx.wallets === 'object');
  assert(/^\w+$/.test(challengerName));
  assert(/^\w+$/.test(walletName));
  assert(/^\w+$/.test(receiptName));
  assert(/^\d+\.\d*$/.test(stageAmount));
  assert(/^[A-Z0-9]{3}$/.test(symbol));

  // Challenger callbacks
  require('../work-steps/challenger/subscribe-dsc-start-callback')(ctx, challengerName);
  require('../work-steps/challenger/subscribe-dsc-disputed-callback')(ctx, challengerName);
  require('../work-steps/challenger/subscribe-wallet-locked-callback')(ctx, challengerName);
  require('../work-steps/challenger/subscribe-balances-seized-callback')(ctx, challengerName);

  // Balances initiator
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  // Balances challenger
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, challengerName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, challengerName, symbol);

  // Proposals
  require('../work-steps/proposals/has-no-dsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-dsc-proposal-nonce')(ctx, walletName, symbol);

  // Start NSC challenge
  require('../../../work-steps/contracts/DriipSettlementChallenge/startChallengeFromPayment-to-be-fulfilled')(ctx, walletName, receiptName, stageAmount, symbol);

  // Proposals
  require('../work-steps/proposals/has-dsc-proposal-status-qualified')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-dsc-proposal-nonce')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-dsc-proposal-staged-amount')(ctx, walletName, stageAmount, symbol);

  // Challenger callbacks
  require('../work-steps/challenger/validate-dsc-start-callback')(ctx, challengerName, walletName, stageAmount, symbol);
  require('../work-steps/challenger/validate-dsc-disputed-callback')(ctx, challengerName, walletName, stageAmount, symbol);
  require('../work-steps/challenger/validate-wallet-locked-callback')(ctx, challengerName, walletName, symbol);
  // TODO: require('../work-steps/challenger/validate-balances-seized-callback')(ctx, challengerName, walletName, stageAmount, symbol);

  // Balances challenger
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, challengerName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, challengerName, '0.0', symbol);

  // Balances initiator
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '-' + stageAmount, symbol);
  require('../../../work-steps/balances/verify-staged-balance-change')(ctx, walletName, '0.0', symbol);
};
