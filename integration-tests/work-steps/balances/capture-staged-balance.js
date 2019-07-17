'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatUnits } = require('ethers').utils;
const assert = require('assert');

module.exports = function (ctx, title, walletName, contentName, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof title === 'string');
  assert(typeof walletName === 'string');
  assert(typeof contentName === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];
    const unit = ctx.currencies[symbol].unit;

    purse[contentName] = purse[contentName] || {};
    purse[contentName][symbol] = formatUnits(await wallet.getNahmiiStagedBalance(symbol), unit);

    expect(purse[contentName][symbol]).to.not.be.undefined.and.not.be.instanceof(Error);

    const blockNo = await ctx.provider.getBlockNumber();
    this.test.title += `: ${purse[contentName][symbol]} ${symbol} at ${blockNo}`;
  });
};
