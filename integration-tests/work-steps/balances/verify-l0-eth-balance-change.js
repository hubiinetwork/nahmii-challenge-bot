'use strict';

const chai = require('chai');
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange, fudge) {
  step(`${walletName} on-chain balance change: ${expectedChange}`, async function () {
    const purse = ctx.purses[walletName];
    const onchainBalanceDiff = subEth(purse.onchainBalanceAfterAction, purse.onchainBalanceBeforeAction);
    const deviation = Math.abs(Number(onchainBalanceDiff) - Number(expectedChange));
    expect(deviation).to.be.lte(fudge);
    this.test.title += ` got ${onchainBalanceDiff}`;
  });
};
