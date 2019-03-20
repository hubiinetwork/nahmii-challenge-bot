'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, walletName, settleAmount, symbol) {

  require('../../work-steps/contract-events/create-ClientFund-StageEvent-promise')(ctx);
  require('../../work-steps/contract-events/create-NullSettlement-SettleNullEvent-promise')(ctx);

  require('../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, walletName);
  require('../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  require('../../work-steps/nsc/proposals/capture-nsc-proposal-expiration-time')(ctx, walletName, symbol);
  require('../../work-steps/proposals/advance-blockchain-by-captured-proposal-expiration-time')(ctx, walletName);

  require('../../work-steps/settlement/settlement-settle')(ctx, walletName, symbol);

  require('../../work-steps/contract-events/validate-NullSettlement-SettleNullEvent-promise')(ctx);
  require('../../work-steps/contract-events/validate-ClientFund-StageEvent-promise')(ctx);

  require('../../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, walletName, null);
  require('../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, walletName, '0.0');
  require('../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, settleAmount);
};
