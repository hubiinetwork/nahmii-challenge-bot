'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx) {
  step('SettleNullEvent event is emitted', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.SettleNullEvent).to.eventually.be.fulfilled;
  });
};
