'use strict';

const chai = require('chai');
chai.use(require('chai-almost')());
const expect = chai.expect;

const { subEth } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange, symbol) {
  if (!symbol)
    throw new Error('symbol undefined');

  step(`${walletName}'s nahmii balance change: ${expectedChange}`, async function () {
    const purse = ctx.purses[walletName];
    const nahmiiBalanceDiff = subEth(purse.nahmiiBalanceAfterAction[symbol], purse.nahmiiBalanceBeforeAction[symbol]);
    expect(Number(nahmiiBalanceDiff)).to.be.almost.equal(Number(expectedChange));
    this.test.title += ` got ${nahmiiBalanceDiff}`;
  });
};
