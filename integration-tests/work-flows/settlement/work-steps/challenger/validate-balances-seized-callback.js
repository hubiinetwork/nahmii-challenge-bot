'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

module.exports = function (ctx, challengerName, walletName, seizedBalance, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof seizedBalance === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} observed a balances-seized notification`, async function () {
    await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].BalancesSeizedPromise).to.eventually.be.fulfilled;
  });

  step('Balances-seized payload is valid', async function () {
    this.timeout(8000);
    const { seizedWallet, seizerWallet, value, ct, id} = await ctx.purses[challengerName].BalancesSeizedPromise;
    expect(seizerWallet).to.equal(ctx.wallets[challengerName].address);
    expect(seizedWallet).to.equal(ctx.wallets[walletName].address);
    expect(value).to.equal(seizedBalance);
    expect(ct.toLowerCase()).to.equal(ctx.currencies[symbol].ct.toLowerCase());
  });
};

