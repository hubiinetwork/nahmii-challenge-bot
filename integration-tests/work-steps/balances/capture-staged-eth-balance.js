'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, title, walletName, contentName) {
  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];

    purse[contentName] = purse[contentName] || {};
    purse[contentName]['ETH'] = ethers.utils.formatEther(await wallet.getNahmiiStagedBalance('ETH'));

    expect(purse[contentName]['ETH']).to.not.be.undefined.and.not.be.instanceof(Error);

    const blockNo = await ctx.provider.getBlockNumber();
    this.test.title += `: ${purse[contentName]['ETH']} ETH at ${blockNo}`;
  });
};
