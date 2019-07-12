'use strict';

const assert = require('assert');

module.exports = function (ctx, walletName, paymentName, settleAmount, symbol) {
  assert (typeof ctx === 'object');
  assert (typeof walletName === 'string');
  assert (typeof paymentName === 'string');
  assert (typeof settleAmount === 'string');
  assert (typeof symbol === 'string');

  // Events
  require('../../../work-steps/contract-events/create-ClientFund-StageEvent-promise')(ctx);
  require('../../../work-steps/contract-events/create-DriipSettlement-SettlePaymentEvent-promise')(ctx);

  // Balances
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  // Proposalse
  require('../work-steps/proposals/capture-dsc-proposal-expiration-time')(ctx, walletName, symbol);
  require('../work-steps/proposals/advance-blockchain-by-captured-proposal-expiration-time')(ctx, walletName);

  // Action
  //require('../work-steps/settlement/settlement-settle')(ctx, walletName, symbol);
  require('../../../work-steps/contracts/DriipSettlement/SettlePayment')(ctx, walletName, paymentName, symbol);

  // Events
  require('../../../work-steps/contract-events/validate-DriipSettlement-SettlePaymentEvent-promise')(ctx);
  require('../../../work-steps/contract-events/validate-ClientFund-StageEvent-promise')(ctx);

  // Balances
  require('../../../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, '-' + settleAmount, symbol);
  require('../../../work-steps/balances/verify-staged-balance-change')(ctx, walletName, settleAmount, symbol);
};
