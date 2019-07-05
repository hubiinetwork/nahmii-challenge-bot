'use strict';

const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, paymentName, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof paymentName === 'string');
  assert(typeof symbol === 'string');

  step (`${walletName} settles DSC`, async function () {
    this.timeout(8000);

    const payment = ctx.purses[walletName][paymentName];
    const contract = ctx.contracts.driipSettlementByPayment.connect(ctx.wallets[walletName]);
    const standard = symbol === 'ETH' ? 'ETH' : 'ERC20';
    const promise = contract.settlePayment(payment, standard, { gasLimit: ctx.gasLimit });

    return expect(promise).to.eventually.be.fulfilled;
  });
};
