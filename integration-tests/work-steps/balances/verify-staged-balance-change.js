'use strict';

const chai = require('chai');
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, symbol, expectedChange) {
  step(`${walletName}'s staged balance change: ${expectedChange}`, async () => {
    const purse = ctx.purses[walletName];
    const stagedBalanceDiff = subEth(purse.stagedBalanceBeforeAction[symbol], purse.stagedBalanceAfterAction[symbol]);
    expect(stagedBalanceDiff).to.be.equal(expectedChange);
  });
};
