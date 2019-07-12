'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;

module.exports = function (ctx, walletName, assignedAmount) {
  step(`${walletName} has new wallet`, function () {
    ctx.purses[walletName] = {};
    ctx.wallets[walletName] = new nahmii.Wallet(ethers.Wallet.createRandom().privateKey, ctx.provider);
    expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    this.test.title += `: ${ctx.wallets[walletName].address}`;
  });

  require('./donate-amount-to-actor')(ctx, walletName, assignedAmount, 'ETH');
  require('./donate-amount-to-actor')(ctx, walletName, assignedAmount, 'T18'); // TODO: make t18 assignment independent
  require('./donate-amount-to-actor')(ctx, walletName, Number(assignedAmount * 1000).toFixed(1), 'T15'); // TODO: make t15 assignment independent

  step(`${walletName} has empty Nahmii balance`, async () => {
    const balance = await ctx.wallets[walletName].getNahmiiBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
