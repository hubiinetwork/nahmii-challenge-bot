'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const { formatEther } = require('ethers').utils;
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, stageAmount) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');

  step(`${challengerName} DSC-start notification observed`, async function () {
    return expect(
      ctx.Miner.mineOneBlock().then(() => {
        return ctx.purses[challengerName].DSCStartPromise;
      })
    ).to.eventually.be.fulfilled;
  });

  step('DSC-start payload is valid', async function () {
    const { initiatorWallet, paymentHash, stagedAmount } = await ctx.purses[challengerName].DSCStartPromise;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(typeof paymentHash).to.be.equal('string');
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
  });
};

