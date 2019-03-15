'use strict';

const chai = require('chai');
const expect = chai.expect;

const ethers = require('ethers');
const minikube = require('../utils/minikube');

module.exports = function (ctx, walletName, withdrawAmount, symbol) {
  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../work-steps/balances/capture-onchain-balance-before-action')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  step(`${walletName} withdraws staged amount`, async () => {
    const purse = ctx.purses[walletName];
    const wallet = ctx.wallets[walletName];
    const currency = await minikube.getCurrency(symbol);
    const settledChallenges = await purse.settlement.settle(currency.ct, 0, wallet, {gasLimit: 6e6});
    expect(settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(Array.isArray(settledChallenges)).to.be.true;
  });

  require('../work-steps/balances/capture-onchain-balance-after-action')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol, null);

  require('../work-steps/balances/verify-onchain-balance-change')(ctx, walletName, symbol, '0.0');
  require('../work-steps/balances/verify-staged-balance-change')(ctx, walletName, symbol, '0.0');
};