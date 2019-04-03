'use strict';

const chai = require('chai');
const expect = chai.expect;
const NestedError = require('../../../../../src/utils/nested-error');

module.exports = function (ctx, walletName) {
  step(`Advance blockchain by ${walletName}'s proposal expiration time`, async function () {
    this.timeout(8000);

    const blockChainNow = (await ctx.provider.getBlock('latest')).timestamp;
    const expirationMargin = 10; // sec
    const proposalExpire = ctx.purses[walletName].proposalExpirationTime + expirationMargin;

    try {
      await ctx.Miner.mineOneBlock();
      await ctx.Miner.advanceTime(proposalExpire - blockChainNow);
      await ctx.Miner.mineOneBlock();
    }
    catch (err) {
      throw new NestedError (err, 'Failed to advance blockchain. ' + err.message);
    }

    const blockChainNext = (await ctx.provider.getBlock('latest')).timestamp;
    expect(proposalExpire - blockChainNext).to.be.lt(1);
    this.test.title += `: ${proposalExpire - blockChainNow} s`;
  });
};