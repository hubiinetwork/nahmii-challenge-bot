'use strict';

const chai = require('chai');
const expect = chai.expect;

const NestedError = require('../../../src/utils/nested-error');

module.exports = function (ctx, title, walletName, contentName, symbol) {
  if (!symbol)
    throw new Error('symbol undefined');

  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];

    purse[contentName] = await wallet.getNahmiiBalance();
    expect(purse[contentName]).to.not.be.undefined.and.not.be.instanceof(Error);

    if (purse[contentName][symbol] === undefined)
      purse[contentName][symbol] = '0.0';

    expect(purse[contentName]).to.have.property(symbol);

    const blockNo = await ctx.provider.getBlockNumber();
    this.test.title += `: ${purse[contentName][symbol]} ${symbol} at ${blockNo}`;
  });
};
