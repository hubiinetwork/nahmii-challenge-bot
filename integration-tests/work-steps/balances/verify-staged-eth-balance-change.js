'use strict';

const chai = require('chai');
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange) {
  step(`${walletName}'s staged balance change: ${expectedChange}`, async () => {
    const purse = ctx.purses[walletName];
    const stagedBalanceDiff = subEth(purse.stagedBalanceAfterAction['ETH'], purse.stagedBalanceBeforeAction['ETH']);
    expect(stagedBalanceDiff).to.be.equal(expectedChange);
  });
};
