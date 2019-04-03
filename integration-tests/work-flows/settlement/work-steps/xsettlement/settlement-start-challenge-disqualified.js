'use strict';

const chai = require('chai');
const expect = chai.expect;
const nahmii = require('nahmii-sdk');
const { parseEther } = require('ethers').utils;

module.exports = function (ctx, walletName, stageAmount, symbol) {
  step(`${walletName} starts challenge process (throws) staging ${stageAmount} ${symbol}`, async () => {
    const purse = ctx.purses[walletName];
    purse.settlement = new nahmii.Settlement(ctx.provider);
    purse.stagedAmount = nahmii.MonetaryAmount.from(parseEther(stageAmount), ctx.currencies[symbol].ct, 0);

    expect(purse.settlement.startChallenge(purse.stagedAmount, ctx.wallets[walletName])).to.eventually.be.rejected;
  });
};