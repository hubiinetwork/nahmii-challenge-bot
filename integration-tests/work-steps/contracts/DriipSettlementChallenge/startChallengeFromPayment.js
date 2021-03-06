'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const assert = require('assert');
const { parseUnits } = require('ethers').utils;

module.exports = function (ctx, title, walletName, paymentName, stageAmount, symbol, expectation) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof paymentName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');
  assert(typeof expectation === 'function');

  step (title, async function () {
    this.timeout(8000);

    const currency = ctx.currencies[symbol];
    const payment = ctx.purses[walletName][paymentName];
    const contract = ctx.contracts.driipSettlementChallengeByPayment.connect(ctx.wallets[walletName]);
    const promise = contract.startChallengeFromPayment(payment, parseUnits(stageAmount, currency.unit), { gasLimit: ctx.gasLimit });

    return expectation(promise);
  });
};
