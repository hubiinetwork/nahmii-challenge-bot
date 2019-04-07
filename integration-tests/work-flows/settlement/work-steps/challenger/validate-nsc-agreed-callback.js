'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');

  step(`${challengerName} observed a NSC-agreed notification`, async function () {
    await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].NSCAgreedPromise).to.eventually.be.fulfilled;
  });

  step('NSC-agreed payload is valid', async function () {
    const { sender } = await ctx.purses[challengerName].NSCAgreedPromise;
    expect(sender).to.equal(ctx.wallets[walletName].address);
  });
};

