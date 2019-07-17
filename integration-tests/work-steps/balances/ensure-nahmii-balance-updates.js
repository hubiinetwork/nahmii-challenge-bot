'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

async function getNahmiiBalance(wallet, symbol) {
  const balances = await wallet.getNahmiiBalance();
  return (balances[symbol] === undefined) ? '0.0' : balances[symbol];
}

module.exports = function (ctx, walletName, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  if (!symbol)
    throw new Error('symbol undefined');

  step(`Ensure ${walletName}'s nahmii balance updates`, async function () {
    this.timeout(16000); // Sometimes takes excessive time

    const balance0 = ctx.purses[walletName]['nahmiiBalanceBeforeAction'];
    expect(balance0[symbol]).to.not.be.undefined;

    const wallet = ctx.wallets[walletName];
    const blockNo0 = await ctx.provider.getBlockNumber();

    await ctx.Miner.mineUntil(async () => {
      const balance = await getNahmiiBalance(wallet, symbol);
      return balance0[symbol] !== balance;
    });

    const blockNo1 = await ctx.provider.getBlockNumber();
    this.test.title += `: ${blockNo0} - ${blockNo1}`;
  });
};
