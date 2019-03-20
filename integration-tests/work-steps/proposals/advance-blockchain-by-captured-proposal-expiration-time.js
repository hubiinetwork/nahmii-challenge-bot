'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, walletName) {
  step(`Advance blockchain by ${walletName}'s proposal expiration time`, async function () {

    const blockChainNow = (await ctx.provider.getBlock('latest')).timestamp;

    const proposalExpire = ctx.purses[walletName].proposalExpirationTime;
    await ctx.Miner.mineOneBlock();
    await ctx.Miner.advanceTime(proposalExpire - blockChainNow);
    await ctx.Miner.mineOneBlock();
    const blockChainNext = (await ctx.provider.getBlock('latest')).timestamp;

    expect(proposalExpire - blockChainNext).to.be.lt(1);
    this.test.title += `: ${proposalExpire - blockChainNow} s`;
  });
};