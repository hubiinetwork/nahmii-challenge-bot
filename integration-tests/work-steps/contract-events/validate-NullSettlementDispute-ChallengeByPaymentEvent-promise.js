'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx) {
  step('NSC ChallengeByPaymentEvent event is emitted', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.nscChallengeByPaymentEvent).to.eventually.be.fulfilled;
  });
};
