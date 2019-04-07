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
    return expect(ctx.purses[challengerName].BalanceSeizedPromise).to.eventually.be.fulfilled;
  });

  step('Wallet-locked payload is valid', async function () {
    const { seizedWallet, seizerWallet, value, ct, id} = await ctx.purses[challengerName].BalancesSeizedPromise;
    expect(seizerWallet).to.equal(ctx.wallets[challengerName].address);
    expect(seizedWallet).to.equal(ctx.wallets[walletName].address);
    expect(value).to.equal(seizedBalance);
    expect(ct).to.equal(ctx.currencies[symbol].ct);
  });
};

