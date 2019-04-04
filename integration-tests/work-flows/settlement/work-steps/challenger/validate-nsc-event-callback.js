'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const { formatEther } = require('ethers').utils;
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} NSC-event notification observed`, async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].NSCEventPromise).to.eventually.be.fulfilled;
  });

  step('NSC-event payload is valid', async function () {
    const { initiatorWallet, stagedAmount, stagedCt, stageId } = await ctx.purses[challengerName].NSCEventPromise;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
    expect(stagedCt).to.equal(ctx.currencies[symbol].ct);
    expect(stageId.toString()).to.equal('0');
  });
};

