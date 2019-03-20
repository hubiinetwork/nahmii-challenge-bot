'use strict';

const chai = require('chai');
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange) {
  step(`${walletName}'s nahmii balance change: ${expectedChange}`, async () => {
    const purse = ctx.purses[walletName];
    const nahmiiBalanceDiff = subEth(purse.nahmiiBalanceAfterAction['ETH'], purse.nahmiiBalanceBeforeAction['ETH']);

    expect(nahmiiBalanceDiff).to.be.equal(expectedChange);
  });
};
