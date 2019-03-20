'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;

module.exports = function (ctx, walletName, assignedEth) {
  step(`${walletName} has new wallet`, () => {
    ctx.purses[walletName] = {};
    ctx.wallets[walletName] = new nahmii.Wallet(ethers.Wallet.createRandom().privateKey, ctx.provider);
    expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
  });

  step(`${walletName} has empty block chain balance`, async function () {
    const balance = await ctx.wallets[walletName].getBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(balance.toString()).to.equal('0');
  });

  step(`${walletName} receives ${assignedEth} ETH from Faucet`, async () => {
    await ctx.Faucet.sendTransaction({
      to: ctx.wallets[walletName].address, value: parseEther(assignedEth), gasLimit: 6000000
    });

    ctx.Miner.mineOneBlock();
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
