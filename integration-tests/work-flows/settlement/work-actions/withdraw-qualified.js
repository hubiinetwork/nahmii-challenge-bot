'use strict';

const chai = require('chai');
const expect = chai.expect;
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { parseEther } = ethers.utils;

module.exports = function (ctx, walletName, withdrawAmount, symbol) {
  require('../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);

  require('../../../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  step(`${walletName} withdraws staged amount ${withdrawAmount} ${symbol}`, async function () {
    const amount = nahmii.MonetaryAmount.from(parseEther(withdrawAmount), ctx.currencies['ETH'].ct, 0);
    const transaction = await ctx.wallets[walletName].withdraw(amount);

    expect(transaction).to.not.be.undefined.and.not.be.instanceof(Error);

    this.test.title += `: at ${await ctx.provider.getBlockNumber()}`;
  });

  require('../../../work-steps/blockchain/advance-blocks')(ctx, 3);

  require('../../../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../../../work-steps/balances/verify-onchain-eth-balance-change')(ctx, walletName, withdrawAmount, 0.004);
  require('../../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, '-' + withdrawAmount);
};