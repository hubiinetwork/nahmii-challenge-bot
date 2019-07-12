'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = require('assert');

const { subUnits } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange, symbol, fudge, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof expectedChange === 'string');
  assert(typeof symbol === 'string');
  assert(typeof fudge === 'number');
  assert(dummy === undefined);

  step(`${walletName} onchain balance change: ${expectedChange} ${symbol}`, async function () {
    const purse = ctx.purses[walletName];

    const balanceBefore = purse.onchainBalanceBeforeAction[symbol];
    expect(balanceBefore).to.not.be.undefined;

    const balanceAfter = purse.onchainBalanceAfterAction[symbol];
    expect(balanceAfter).to.not.be.undefined;

    const unit = ctx.currencies[symbol].unit;

    const onchainBalanceDiff = subUnits(balanceAfter, balanceBefore, unit);
    const deviation = Math.abs(Number(onchainBalanceDiff) - Number(expectedChange));
    expect(deviation).to.be.lte(fudge);

    this.test.title += ` got ${onchainBalanceDiff}`;
  });
};
