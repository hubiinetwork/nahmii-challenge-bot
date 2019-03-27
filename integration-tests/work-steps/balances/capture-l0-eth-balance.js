'use strict';

const chai = require('chai');
const ethers = require('ethers');
const { formatEther } = ethers.utils;

module.exports = async function (ctx, title, walletName, contentName) {
  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];

    purse[contentName] = await wallet.getBalance();
    chai.expect(purse[contentName]).to.not.be.undefined.and.not.be.instanceof(Error);

    const blockNo = await ctx.provider.getBlockNumber();
    this.test.title += `: ${formatEther(purse[contentName])} ETH at ${blockNo}`;
  });
};
