'use strict';

const chai = require('chai');
const expect = chai.expect;
const NestedError = require('../../../src/utils/nested-error');

module.exports = function (ctx) {
  step('SettleNullEvent event is emitted', async function () {
    try {
      await ctx.Miner.mineOneBlock();
    }
    catch (err) {
      throw new NestedError (err, 'Mining failed. ' + err.message);
    }
    return expect(ctx.promises.SettleNullEvent).to.eventually.be.fulfilled;
  });
};
