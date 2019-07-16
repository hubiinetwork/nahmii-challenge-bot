'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;
const assert = require('assert');

module.exports = function (ctx, walletName, assignedAmountArr, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(Array.isArray(assignedAmountArr));
  assert(assignedAmountArr.length >= 1);
  for (let i = 0; i < assignedAmountArr.length; ++i)
    assert(assignedAmountArr[i].length === 2);
  assert(dummy === undefined);

  step(`${walletName} has new wallet`, function () {
    ctx.purses[walletName] = {};
    ctx.wallets[walletName] = new nahmii.Wallet(ethers.Wallet.createRandom().privateKey, ctx.provider);
    expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    this.test.title += `: ${ctx.wallets[walletName].address}`;
  });

  for (const [amount, symbol] of assignedAmountArr)
    require('./donate-amount-to-actor')(ctx, walletName, amount, symbol);

  step(`${walletName} has empty Nahmii balance`, async () => {
    const balance = await ctx.wallets[walletName].getNahmiiBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
