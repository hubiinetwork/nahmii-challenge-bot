'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, title, walletName, contentName) {
  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];

    purse[contentName] = await wallet.getNahmiiBalance();
    expect(purse[contentName]).to.not.be.undefined.and.not.be.instanceof(Error);

    if (purse[contentName]['ETH'] === undefined)
      purse[contentName]['ETH'] = '0.0';

    expect(purse[contentName]).to.have.property('ETH');

    const blockNo = await ctx.provider.getBlockNumber();
    this.test.title += `: ${purse[contentName]['ETH']} ETH at ${blockNo}`;
  });
};
