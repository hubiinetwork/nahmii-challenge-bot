'use strict';

const chai = require('chai');
const expect = chai.expect;
const NestedError = require('../../../src/utils/nested-error');

module.exports = (ctx) => {
  step('ClientFund ReceiveEvent is observed', async function () {
    try {
      await ctx.Miner.mineOneBlock();
      await ctx.Miner.mineOneBlock();
    }
    catch (err) {
      throw new NestedError (err, 'Failed to mine block. ' + err.message);
    }
    return expect(ctx.promises.ReceiveEvent).to.eventually.be.fulfilled;
  });
};
