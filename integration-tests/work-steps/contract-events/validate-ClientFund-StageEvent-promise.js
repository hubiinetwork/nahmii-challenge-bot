'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = (ctx) => {
  step('StageEvent event is emitted', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.StageEvent).to.eventually.be.fulfilled;
  });
};

