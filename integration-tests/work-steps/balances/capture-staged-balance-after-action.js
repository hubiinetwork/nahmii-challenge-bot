'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, walletName, symbol, oldBalanceValue) {
  step(`Capture ${walletName}'s staged balance after action`, async () => {
    const purse = ctx.purses[walletName];
    oldBalanceValue = (oldBalanceValue === undefined) ? purse.stagedBalanceBeforeAction[symbol] : oldBalanceValue;

    purse.stagedBalanceAfterAction = purse.stagedBalanceAfterAction || {};

    await ctx.Miner.mineUntil(async () => {
      purse.stagedBalanceAfterAction[symbol] = ethers.utils.formatEther(await ctx.wallets[walletName].getNahmiiStagedBalance(symbol));
      return purse.stagedBalanceAfterAction[symbol] !== oldBalanceValue;
    }, 200, 100);

    expect(purse.stagedBalanceAfterAction[symbol]).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
