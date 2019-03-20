'use strict';

const chai = require('chai');
const expect = chai.expect;

const minikube = require('../utils/minikube');

module.exports = function (ctx, walletName, settleAmount, symbol) {
  require('../work-steps/contract-events/create-stage-event-promise')(ctx);
  require('../work-steps/contract-events/create-settle-payment-event-promise')(ctx);

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);


  step(`${walletName} settles staged amount`, async () => {
    const purse = ctx.purses[walletName];
    const settledChallenges = await purse.settlement.settle(currency.ct, 0, ctx.wallets[walletName], {gasLimit: 6e6});
    expect(settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(Array.isArray(settledChallenges)).to.be.true;
  });

  require('../work-steps/contract-events/validate-stage-event-promise')(ctx);
  require('../work-steps/contract-events/validate-settle-payment-event-promise')(ctx);

  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol, null);
  require('../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol, null);

  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, symbol, '0.0');
  require('../work-steps/balances/verify-staged-balance-change')(ctx, walletName, symbol, '0.0');
};
