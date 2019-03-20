'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = (ctx) => {
  step('ClientFund ReceiveEvent is observed', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.ReceiveEvent).to.eventually.be.fulfilled;
  });
};
