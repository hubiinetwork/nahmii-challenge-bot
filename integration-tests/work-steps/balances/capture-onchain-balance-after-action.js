'use strict';

const chai = require('chai');

module.exports = function (ctx, walletName, symbol, oldBalanceValue) {
  step(`Capture ${walletName}'s on-chain balance after action`, async function () {
    const purse = ctx.purses[walletName];
    oldBalanceValue = (oldBalanceValue === undefined) ? purse.onchainBalanceBeforeAction : oldBalanceValue;

    await ctx.Miner.mineUntil(async () => {
      purse.onchainBalanceAfterAction = await ctx.wallets[walletName].getBalance();
      return purse.onchainBalanceAfterAction !== oldBalanceValue;
    }, 200, 100);

    chai.expect(purse.onchainBalanceAfterAction).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
