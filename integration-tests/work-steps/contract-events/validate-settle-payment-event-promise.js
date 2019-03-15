'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = (ctx) => {
  step('SettlePaymentEvent event is emitted', async function () {
    this.timeout(5000);
    expect(ctx.promises.SettlePaymentEvent).to.eventually.be.fulfilled;
  });
};