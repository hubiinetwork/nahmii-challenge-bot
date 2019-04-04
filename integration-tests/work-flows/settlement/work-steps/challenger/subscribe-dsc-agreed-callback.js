'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a DSC-agreed notification`, async () => {
    ctx.purses[challengerName].DSCAgreedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onDSCAgreed((address, proof, targetBalance) => {
        challenger.onDSCAgreed(null);
        resolve({ address, proof, targetBalance });
      });
    });
  });
};
