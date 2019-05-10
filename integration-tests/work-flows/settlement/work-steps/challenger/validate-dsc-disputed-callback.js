'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const { bigNumberify } = require('ethers').utils;
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} observed a DSC-disputed notification`, async function () {
    this.timeout(8000);
    await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].DSCDisputedPromise).to.eventually.be.fulfilled;
  });

  step('DSC-disputed payload is valid', async function () {
    const { initiatorAddress, finalReceipt, targetBalance } = await ctx.purses[challengerName].DSCDisputedPromise;
    const walletAddress = ctx.wallets[walletName].address.toLowerCase();
    expect(initiatorAddress.toLowerCase()).to.equal(walletAddress);
    expect(finalReceipt).have.property('sender').property('wallet').equal(walletAddress);
    expect(bigNumberify(targetBalance).lt(0)).to.be.true;
  });
};

