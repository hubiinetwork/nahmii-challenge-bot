'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const { subUnits } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof expectedChange === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(`${walletName}'s staged ${symbol} balance change: ${expectedChange}`, async function () {
    const purse = ctx.purses[walletName];

    const balanceBefore = purse.stagedBalanceBeforeAction[symbol];
    expect(balanceBefore).to.not.be.undefined;

    const balanceAfter = purse.stagedBalanceAfterAction[symbol];
    expect(balanceAfter).to.not.be.undefined;

    const unit = ctx.currencies[symbol].unit;

    const stagedBalanceDiff = subUnits(balanceAfter, balanceBefore, unit);
    expect(stagedBalanceDiff).to.be.equal(expectedChange);

    this.test.title += ` got ${stagedBalanceDiff}`;
  });
};
