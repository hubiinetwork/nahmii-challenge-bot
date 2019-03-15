'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, walletName, symbol) {
  step(`Capture ${walletName}'s staged balance before action`, async () => {
    const purse = ctx.purses[walletName];

    purse.stagedBalanceBeforeAction = purse.stagedBalanceBeforeAction || {};
    purse.stagedBalanceBeforeAction[symbol] = ethers.utils.formatEther(await ctx.wallets[walletName].getNahmiiStagedBalance(symbol));

    expect(purse.stagedBalanceBeforeAction[symbol]).to.not.be.undefined.and.not.be.instanceof(Error);
  });
};
