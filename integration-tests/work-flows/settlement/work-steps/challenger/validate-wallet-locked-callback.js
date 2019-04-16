'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');
const ethers = require('ethers');

module.exports = function (ctx, challengerName, walletName, expectedBalance, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof expectedBalance === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} observed a wallet-locked notification`, async function () {
    await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].WalletLockedPromise).to.eventually.be.fulfilled;
  });

  step('Wallet-locked payload is valid', async function () {
    const { challengerWallet, lockedWallet, balance, ct, id } = await ctx.purses[challengerName].WalletLockedPromise;
    expect(challengerWallet).to.equal(ctx.wallets[challengerName].address);
    expect(lockedWallet).to.equal(ctx.wallets[walletName].address);
    if (symbol === 'ETH')
      expect(ethers.utils.formatEther(balance)).to.equal(expectedBalance);
    else
      expect(balance.toString()).to.equal(expectedBalance);
    expect(ct).to.equal(ctx.currencies[symbol].ct);
  });
};

