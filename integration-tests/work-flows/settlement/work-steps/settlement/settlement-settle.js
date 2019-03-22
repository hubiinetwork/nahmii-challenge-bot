'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, walletName, symbol) {
  step(`${walletName} settles staged amount`, async () => {
    const purse = ctx.purses[walletName];
    const settledChallenges = await purse.settlement.settle(ctx.currencies[symbol].ct, 0, ctx.wallets[walletName], {gasLimit: 6e6});
    expect(settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(Array.isArray(settledChallenges)).to.be.true;
    expect(settledChallenges.length).to.be.gt(0); // Something must have been settled
  });
};