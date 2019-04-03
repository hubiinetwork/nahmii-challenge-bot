'use strict';
/*
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = require('assert');
const { parseUnits } = require('ethers').utils;

module.exports = function (ctx, walletName, paymentName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof paymentName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  step (`${walletName} starts DSC that is fulfilled`, async () => {
    const currency = ctx.currencies[symbol];
    const payment = ctx.purses[walletName][paymentName];
    const contract = ctx.contracts.driipSettlementChallenge.connect(ctx.wallets[walletName]);
    const promise = contract.startChallengeFromPayment(payment, parseUnits(stageAmount, currency.unit));

    return expect(promise).to.eventually.be.fulfilled;
  });
};
*/
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, paymentName, stageAmount, symbol) {
  require('./startChallengeFromPayment')(
    ctx, `${walletName} starts DSC that is fulfilled`,
    walletName, paymentName, stageAmount, symbol,
    (promise) => expect(promise).to.eventually.be.fulfilled
  );
};