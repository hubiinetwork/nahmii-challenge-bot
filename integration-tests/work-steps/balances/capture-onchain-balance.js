'use strict';

const chai = require('chai');
const ethers = require('ethers');
const { formatUnits } = ethers.utils;
const assert = require('assert');

module.exports = async function (ctx, title, walletName, contentName, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof title === 'string');
  assert(typeof walletName === 'string');
  assert(typeof contentName === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];

    const balance = (symbol === 'ETH')
      ? await wallet.getBalance()
      : await ctx.contracts[symbol].balanceOf(wallet.address);

    purse[contentName] = purse[contentName] || {};
    purse[contentName][symbol] = balance;
    chai.expect(purse[contentName][symbol]).to.not.be.undefined.and.not.be.instanceof(Error);

    const blockNo = await ctx.provider.getBlockNumber();
    const unit = ctx.currencies[symbol].unit;
    this.test.title += `: ${formatUnits(balance, unit)} ${symbol} at ${blockNo}`;
  });
};
