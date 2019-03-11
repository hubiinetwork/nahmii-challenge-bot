'use strict';

const chai = require('chai');

module.exports = async function (ctx, walletName) {
  step(`Capture ${walletName}'s on-chain balance before action`, async function () {
    const purse = ctx.purses[walletName];
    purse.onchainBalanceBeforeAction = await ctx.wallets[walletName].getBalance();
    chai.expect(purse.onchainBalanceBeforeAction).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
