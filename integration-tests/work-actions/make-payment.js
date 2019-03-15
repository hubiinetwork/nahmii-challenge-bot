'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const parseEther = ethers.utils.parseEther;


module.exports = function (ctx, fromName, fromAmount, toName, toAmount, symbol) {
  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, fromName);
  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, toName);

  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, fromName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, toName, symbol);

  step(`Prepare payment where ${fromName} pays ${toName} ${toAmount} ${symbol}`, async () => {
    const purse = ctx.purses[fromName];
    const monetaryAmount = nahmii.MonetaryAmount.from(parseEther(toAmount), ctx.currencies[symbol].ct);
    purse.payment = new nahmii.Payment(monetaryAmount, ctx.wallets[fromName].address, ctx.wallets[toName].address, ctx.wallets[fromName]);
    expect(purse.payment).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Sign payment', async () => {
    const purse = ctx.purses[fromName];
    purse.payment.sign();
  });

  step('Register payment', async () => {
    const purse = ctx.purses[fromName];
    const promisedResult = purse.payment.register();
    expect(promisedResult).to.eventually.be.fulfilled;
    expect(purse.payment.isSigned()).to.be.true;
  });

  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, fromName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, toName, symbol, null);

  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, fromName, symbol, fromAmount);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, toName, symbol, toAmount);
};
