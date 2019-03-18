'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, walletName, symbol, oldBalanceValue) {
  step(`Capture ${walletName}'s nahmii balance after action`, async () => {
    const purse = ctx.purses[walletName];
    oldBalanceValue = (oldBalanceValue === undefined) ? purse.nahmiiBalanceBeforeAction[symbol] : oldBalanceValue;

    const minerPromise = ctx.Miner.mineUntil(async () => {
      purse.nahmiiBalanceAfterAction = await ctx.wallets[walletName].getNahmiiBalance();
      purse.nahmiiBalanceAfterAction[symbol] = purse.nahmiiBalanceAfterAction[symbol] || '0.0';
      return purse.nahmiiBalanceAfterAction[symbol] !== oldBalanceValue;
    }, 200, 100);

    await expect(minerPromise).to.eventually.be.fulfilled;
    expect(purse.nahmiiBalanceAfterAction).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(purse.nahmiiBalanceAfterAction).to.have.property(symbol);

    return minerPromise;
  });
};
