'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx) {
  step('DSC ChallengeByPaymentEvent event is emitted', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.dscChallengeByPaymentEvent).to.eventually.be.fulfilled;
  });
};
