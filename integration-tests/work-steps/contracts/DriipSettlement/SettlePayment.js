'use strict';

const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, paymentName) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof paymentName === 'string');

  step (`${walletName} settles DSC`, async () => {
    const payment = ctx.purses[walletName][paymentName];
    const contract = ctx.contracts.driipSettlement.connect(ctx.wallets[walletName]);
    const promise = contract.settlePayment(payment, ctx.gasLimit);

    return expect(promise).to.eventually.be.fulfilled;
  });
};
