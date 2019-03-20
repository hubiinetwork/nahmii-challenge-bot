
'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, timeInterval) {
  step('Advance blockchain ${timeInterval} seconds', async function () {
    const time0 = (await ctx.provider.getBlock('latest')).timestamp;

    this.provider.send('evm_increaseTime', [ timeInterval ]);
    this.provider.send('evm_mine', []);

    const time1 = (await ctx.provider.getBlock('latest')).timestamp;

    expect(time1 - time0).to.equal(timeInterval);
  });
};
