'use strict';

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {

  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  require('../work-steps/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  require('../work-steps/settlement/settlement-start-challenge-disqualified')(ctx, walletName, stageAmount, symbol, 'null');

  require('../../../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../../../work-steps/balances/verify-onchain-eth-balance-change')(ctx, walletName, '0.0', 0.003);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '0.0', symbol);
  require('../../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, '0.0');
};
