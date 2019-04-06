'use strict';

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {

  // Challenger callbacks
  require('../work-steps/challenger/subscribe-nsc-event-callback')(ctx, challengerName);
  require('../work-steps/challenger/subscribe-nsc-dispute-callback')(ctx, challengerName);
  require('../work-steps/challenger/subscribe-nsc-lock-callback')(ctx, challengerName);
  require('../work-steps/challenger/subscribe-nsc-seize-callback')(ctx, challengerName);

  // Balances initiator
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  // Balances challenger
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, challengerName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, challengerName, symbol);

  // Proposals
  require('../work-steps/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  // Start NSC challenge
  require('../../../work-steps/contracts/NullSettlementChallenge/startChallenge-to-be-fulfilled')(ctx, walletName, stageAmount, symbol);

  // Proposals
  require('../work-steps/proposals/has-nsc-proposal-status-qualified')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-nsc-proposal-nonce')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-nsc-proposal-staged-amount')(ctx, walletName, stageAmount, symbol);

  // Challenger callbacks
  require('../work-steps/challenger/validate-nsc-event-callback')(ctx, challengerName, walletName, stageAmount, symbol);
  require('../work-steps/challenger/validate-nsc-dispute-callback')(ctx, challengerName, walletName, stageAmount, symbol);
  require('../work-steps/challenger/validate-nsc-lock-callback')(ctx, challengerName, walletName, stageAmount, symbol);
  require('../work-steps/challenger/validate-nsc-seize-callback')(ctx, challengerName, walletName, stageAmount, symbol);

  // Balances challenger
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, challengerName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, challengerName, '0.0', symbol);

  // Balances initiator
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '0.0', symbol);
  require('../../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, '0.0');
};
