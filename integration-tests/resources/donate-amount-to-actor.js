'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatUnits, parseUnits } = ethers.utils;
const assert = require('assert');

module.exports = function (ctx, walletName, assignedAmount, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof assignedAmount === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(`${walletName} has empty ${symbol} block chain balance`, async function () {
    const wallet = await ctx.wallets[walletName];

    const balance = (symbol === 'ETH')
      ? await wallet.getBalance()
      : await ctx.contracts[symbol].balanceOf(wallet.address);

    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(balance.toString()).to.equal('0');
  });

  step(`${walletName} receives ${assignedAmount} ${symbol} from Faucet`, async () => {
    const wallet = await ctx.wallets[walletName];
    const unit = ctx.currencies[symbol].unit;
    const value = parseUnits(assignedAmount, unit);

    const transferPromise = (symbol === 'ETH')
      ? ctx.Faucet.sendTransaction({ to: wallet.address, value, gasLimit: ctx.gasLimit })
      : ctx.contracts[symbol].connect(ctx.Faucet).transfer(wallet.address, value, { gasLimit: ctx.gasLimit });

    return expect(transferPromise.then(() => ctx.Miner.mineOneBlock())).to.eventually.be.fulfilled;
  });

  step(`${walletName} has ${symbol} in block chain balance`, async () => {
    const wallet = await ctx.wallets[walletName];
    const unit = ctx.currencies[symbol].unit;

    const balance = (symbol === 'ETH')
      ? await wallet.getBalance()
      : await ctx.contracts[symbol].balanceOf(wallet.address);

    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(formatUnits(balance, unit)).to.equal(assignedAmount);
  });
};
