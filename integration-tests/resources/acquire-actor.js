'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;
const NestedError = require('../../src/utils/nested-error');

module.exports = function (ctx, walletName, assignedEth) {
  step(`${walletName} has new wallet`, function () {
    ctx.purses[walletName] = {};
    ctx.wallets[walletName] = new nahmii.Wallet(ethers.Wallet.createRandom().privateKey, ctx.provider);
    expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    this.test.title += `: ${ctx.wallets[walletName].address}`;
  });

  step(`${walletName} has empty block chain balance`, async function () {
    const balance = await ctx.wallets[walletName].getBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(balance.toString()).to.equal('0');
  });

  step(`${walletName} receives ${assignedEth} ETH from Faucet`, async () => {
    return expect(
      ctx.Faucet.sendTransaction({
        to: ctx.wallets[walletName].address, value: parseEther(assignedEth), gasLimit: ctx.gasLimit
      }).then(
        () => ctx.Miner.mineOneBlock()
      )).to.eventually.be.fulfilled;
  });

  step(`${walletName} has ETH in block chain balance`, async () => {
    const balance = await ctx.wallets[walletName].getBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(formatEther(balance)).to.equal(assignedEth);
  });

  step(`${walletName} has empty Nahmii balance`, async () => {
    const balance = await ctx.wallets[walletName].getNahmiiBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
