'use strict';

const chai = require('chai');
const expect = chai.expect;
const NestedError = require('../../../src/utils/nested-error');

module.exports = function (ctx) {
  step('DSC ChallengeByPaymentEvent event is emitted', async function () {
    try {
      await ctx.Miner.mineOneBlock();
    }
    catch (err) {
      throw new NestedError(err, 'Failed to mine. ' + err.message);
    }
    return expect(ctx.promises.dscChallengeByPaymentEvent).to.eventually.be.fulfilled;
  });
};
