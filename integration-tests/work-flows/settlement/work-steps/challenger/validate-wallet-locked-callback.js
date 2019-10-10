'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');
const config = require('../../../../../src/config');
const t = require('../../../../../src/runtime-types');

module.exports = function (ctx, challengerName, walletName, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} observed a wallet-locked notification`, async function () {
    this.timeout(Math.max(2000 * config.services.confirmationsDepth, 8000));
    return expect(ctx.Miner.mineBlocksUntilResolved(ctx.purses[challengerName].WalletLockedPromise)).to.eventually.be.fulfilled;
  });

  step('Wallet-locked payload is valid', async function () {
    this.timeout(8000);
    const { challengerWallet, lockedWallet, ct, id } = await ctx.purses[challengerName].WalletLockedPromise;
    t.EthereumAddress().assert(challengerWallet);
    t.EthereumAddress().assert(lockedWallet);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    expect(challengerWallet.isEqual(ctx.wallets[challengerName].address)).to.be.true;
    expect(lockedWallet.isEqual(ctx.wallets[walletName].address)).to.be.true;
    expect(ct.isEqual(ctx.currencies[symbol].ct)).to.be.true;
  });
};

