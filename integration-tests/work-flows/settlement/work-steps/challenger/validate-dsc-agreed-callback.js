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

  step(`${challengerName} observed a DSC-agreed notification`, async function () {
    await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].DSCAgreedPromise).to.eventually.be.fulfilled;
  });

  step('DSC-agreed payload is valid', async function () {
    const { sender, finalReceipt, targetBalance } = await ctx.purses[challengerName].DSCAgreedPromise;

    expect(sender).to.equal(ctx.wallets[walletName].address);
    expect(finalReceipt).have.property('sender').property('wallet').equal(sender);
    expect(bigNumberify(targetBalance).gte(0)).to.be.true;
  });
};

