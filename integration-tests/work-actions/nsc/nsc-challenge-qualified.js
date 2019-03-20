'use strict';

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {

  require('../../work-steps/nsc/challenger/subscribe-nsc-start-challenge-event')(ctx, challengerName);

  require('../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, walletName);
  require('../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  require('../../work-steps/nsc/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../../work-steps/nsc/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  require('../../work-steps/settlement/settlement-start-challenge-qualified')(ctx, walletName, stageAmount, symbol, 'null');

  require('../../work-steps/nsc/proposals/has-nsc-proposal-status-qualified')(ctx, walletName, symbol);
  require('../../work-steps/nsc/proposals/has-nsc-proposal-nonce')(ctx, walletName, symbol);
  require('../../work-steps/nsc/proposals/has-nsc-proposal-staged-amount')(ctx, walletName, stageAmount, symbol);

  require('../../work-steps/nsc/challenger/observed-nsc-start-challenge-event')(ctx, challengerName, walletName, stageAmount, symbol);

  require('../../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, walletName, null);
  require('../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, walletName, '0.0');
  require('../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, '0.0');
};
