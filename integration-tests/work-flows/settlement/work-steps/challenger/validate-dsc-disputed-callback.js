'use strict';
/*global step :true*/

const t = require('../../../../../src/runtime-types');

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
    t.EthereumAddress().assert(initiatorAddress);
    t.EthersBigNumber().assert(targetBalance);

    const walletAddress = ctx.wallets[walletName].address.toLowerCase();
    expect(initiatorAddress.isEqual(walletAddress)).to.be.true;
    expect(finalReceipt).have.property('sender').property('wallet').equal(walletAddress);
    expect(targetBalance.lt(0)).to.be.true;
  });
};

