'use strict';

const chai = require('chai');
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, symbol, expectedChange) {
  step(`${walletName} on-chain balance change: ${expectedChange}`, async function () {
    const purse = ctx.purses[walletName];
    const nahmiiBalanceDiff = subEth(purse.onchainBalanceAfterAction, purse.onchainBalanceBeforeAction);
    expect(nahmiiBalanceDiff).to.be.equal(expectedChange);
  });
};
