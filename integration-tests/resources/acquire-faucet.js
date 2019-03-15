'use strict';

const chai = require('chai');
const expect = chai.expect;
const minikube = require('../utils/minikube');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');

module.exports = function (ctx) {
  step('Faucet source of ETH', async () => {
    ctx.Faucet = new nahmii.Wallet(minikube.accounts.faucet.privateKey, ctx.provider);
    const balance = ethers.utils.formatEther(await ctx.Faucet.getBalance());
    console.log(`        Faucet ${ctx.Faucet.address} has: ${balance} ETH`);
    expect(ctx.Faucet).to.be.instanceof(nahmii.Wallet);
    expect(Number(balance)).to.be.gt(10);
  });
};
