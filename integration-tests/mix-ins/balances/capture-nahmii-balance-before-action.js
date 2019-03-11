'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, walletName, symbol) {
  step(`Capture ${walletName}'s nahmii balance before action`, async () => {
    const purse = ctx.purses[walletName];
    purse.nahmiiBalanceBeforeAction = await ctx.wallets[walletName].getNahmiiBalance();
    expect(purse.nahmiiBalanceBeforeAction).to.not.be.undefined.and.not.be.instanceof(Error);

    if (purse.nahmiiBalanceBeforeAction[symbol] === undefined)
      purse.nahmiiBalanceBeforeAction[symbol] = '0.0';

    expect(purse.nahmiiBalanceBeforeAction).to.have.property(symbol);
  });
};
