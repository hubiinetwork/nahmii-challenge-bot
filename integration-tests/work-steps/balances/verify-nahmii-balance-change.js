'use strict';

const chai = require('chai');
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, symbol, expectedChange) {
  step(`${walletName}'s nahmii balance change: ${expectedChange}`, async () => {
    const purse = ctx.purses[walletName];
    const nahmiiBalanceDiff = subEth(purse.nahmiiBalanceAfterAction[symbol], purse.nahmiiBalanceBeforeAction[symbol]);

    expect(nahmiiBalanceDiff).to.be.equal(expectedChange);
  });
};
