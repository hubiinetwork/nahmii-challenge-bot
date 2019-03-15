'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = (ctx) => {
  step('StageEvent event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(ctx.promises.StageEvent).to.eventually.be.fulfilled;
  });
};

