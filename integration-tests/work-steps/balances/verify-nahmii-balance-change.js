'use strict';

const chai = require('chai');
chai.use(require('chai-almost')());
const expect = chai.expect;
const assert = require('assert');

const { subUnits } = require('../../../src/utils/mixed-big-number-ops');

module.exports = function (ctx, walletName, expectedChange, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof expectedChange === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(`${walletName}'s nahmii balance change: ${expectedChange}`, async function () {
    const purse = ctx.purses[walletName];
    const unit = ctx.currencies[symbol].unit;

    const nahmiiBalanceDiff = subUnits(purse.nahmiiBalanceAfterAction[symbol], purse.nahmiiBalanceBeforeAction[symbol], unit);
    expect(Number(nahmiiBalanceDiff)).to.be.almost.equal(Number(expectedChange));

    this.test.title += ` got ${nahmiiBalanceDiff}`;
  });
};
