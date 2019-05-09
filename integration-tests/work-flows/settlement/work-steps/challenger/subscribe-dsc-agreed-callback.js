'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a DSC-agreed notification`, async () => {
    ctx.purses[challengerName].DSCAgreedPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onDSCAgreed((address, proof, targetBalance) => {
        callbacks.onDSCAgreed(null);
        resolve({ address, proof, targetBalance });
      });
    });
  });
};
