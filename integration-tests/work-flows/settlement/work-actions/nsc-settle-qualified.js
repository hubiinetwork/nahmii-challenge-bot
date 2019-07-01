'use strict';

module.exports = function (ctx, walletName, settleAmount, symbol) {
  // Events
  require('../../../work-steps/contract-events/create-ClientFund-StageEvent-promise')(ctx);
  require('../../../work-steps/contract-events/create-NullSettlement-SettleNullEvent-promise')(ctx);

  // Balances
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  // Proposals
  require('../work-steps/proposals/capture-nsc-proposal-expiration-time')(ctx, walletName, symbol);
  require('../work-steps/proposals/advance-blockchain-by-captured-proposal-expiration-time')(ctx, walletName);

  // Action
  require('../../../work-steps/contracts/NullSettlement/SettleNull')(ctx, walletName, symbol);

  // Events
  require('../../../work-steps/contract-events/validate-NullSettlement-SettleNullEvent-promise')(ctx);
  require('../../../work-steps/contract-events/validate-ClientFund-StageEvent-promise')(ctx);

  // Balances
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '-' + settleAmount, symbol);
  require('../../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, settleAmount);
};
