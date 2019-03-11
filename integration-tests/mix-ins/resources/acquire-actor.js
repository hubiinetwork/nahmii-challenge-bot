'use strict';

const chai = require('chai');
const expect = chai.expect;

const minikube = require('../../utils/minikube');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;

module.exports = function (ctx) {
  step('Provider', async () => {
    ctx.provider = new nahmii.NahmiiProvider(minikube.baseUrl, minikube.appId, minikube.appSecret, minikube.nodeUrl, 'ropsten');
    chai.expect(ctx.provider).to.be.instanceof(nahmii.NahmiiProvider);
  });
};

module.exports = function (ctx, walletName) {
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

  step(`${walletName} receives ETH from Faucet`, async () => {
    await ctx.Faucet.sendTransaction({
      to: ctx.wallets[walletName].address, value: parseEther('1.0'), gasLimit: 6000000
    });

    ctx.Miner.mineOneBlock();
  });

  step(`${walletName} has ETH in block chain balance`, async () => {
    const balance = await ctx.wallets[walletName].getBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(formatEther(balance)).to.equal('1.0');
  });

  step(`${walletName} has empty Nahmii balance`, async () => {
    const balance = await ctx.wallets[walletName].getNahmiiBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
