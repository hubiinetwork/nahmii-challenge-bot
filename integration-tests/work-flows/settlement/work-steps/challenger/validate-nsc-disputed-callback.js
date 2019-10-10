'use strict';
/*global step :true*/

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const { bigNumberify } = require('ethers').utils;
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} observed a NSC-disputed notification`, async function () {
    this.timeout(8000);
    await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].NSCDisputedPromise).to.eventually.be.fulfilled;
  });

  step('NSC-disputed payload is valid', async function () {
/*
    const { initiatorAddress, finalReceipt, targetBalance } = await ctx.purses[challengerName].NSCDisputedPromise;
    expect(initiatorAddress).to.equal(ctx.wallets[walletName].address);
    expect(finalReceipt).have.property('sender').property('wallet').equal(ctx.wallets[walletName].address.toLowerCase());
    expect(bigNumberify(targetBalance).lt(0)).to.be.true;
*/
    return expect(ctx.purses[challengerName].NSCDisputedPromise.then(res => {
      const walletAddress = ctx.wallets[walletName].address;
      expect(res.initiatorAddress.isEqual(walletAddress)).to.be.true;
      expect(res.finalReceipt).have.property('sender').property('wallet').equal(walletAddress.toLowerCase());
      expect(bigNumberify(res.targetBalance).lt(0)).to.be.true;
      return Promise.resolve();
    })).to.eventually.be.fulfilled;

  });
};

