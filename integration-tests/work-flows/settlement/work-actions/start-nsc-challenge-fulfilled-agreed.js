'use strict';

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {

  // Event
  require('../work-steps/challenger/subscribe-nsc-start-callback')(ctx, challengerName);

  // Balances
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  // Proposals
  require('../work-steps/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  // Start NSC challenge
  require('../../../work-steps/contracts/NullSettlementChallenge/startChallenge-to-be-fulfilled')(ctx, walletName, stageAmount, symbol);

  // Proposals
  require('../work-steps/proposals/has-nsc-proposal-status-qualified')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-nsc-proposal-nonce')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-nsc-proposal-staged-amount')(ctx, walletName, stageAmount, symbol);

  // Event
  require('../work-steps/challenger/validate-nsc-start-callback')(ctx, challengerName, walletName, stageAmount, symbol);

  // Balances
  require('../../../work-steps/balances/ensure-nahmii-balance-updates')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '-' + stageAmount, symbol);
  require('../../../work-steps/balances/verify-staged-balance-change')(ctx, walletName, '0.0', symbol);
};
