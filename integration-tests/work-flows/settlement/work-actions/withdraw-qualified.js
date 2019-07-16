'use strict';

const chai = require('chai');
const expect = chai.expect;
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { parseEther } = ethers.utils;

module.exports = function (ctx, walletName, withdrawAmount, symbol) {
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);

  require('../../../work-steps/balances/capture-onchain-balance-before-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  step(`${walletName} withdraws staged amount ${withdrawAmount} ${symbol}`, async function () {
    const amount = nahmii.MonetaryAmount.from(parseEther(withdrawAmount), ctx.currencies[symbol].ct, 0);
    const transaction = await ctx.wallets[walletName].withdraw(amount);

    expect(transaction).to.not.be.undefined.and.not.be.instanceof(Error);

    this.test.title += `: at ${await ctx.provider.getBlockNumber()}`;
  });

  require('../../../work-steps/blockchain/advance-blocks')(ctx, 3);

  require('../../../work-steps/balances/capture-onchain-balance-after-action')(ctx, walletName, symbol);
  require('../../../work-steps/balances/capture-staged-balance-after-action')(ctx, walletName, symbol);

  require('../../../work-steps/balances/verify-onchain-balance-change')(ctx, walletName, withdrawAmount, symbol, 0.004);
  require('../../../work-steps/balances/verify-staged-balance-change')(ctx, walletName, '-' + withdrawAmount, symbol);
};