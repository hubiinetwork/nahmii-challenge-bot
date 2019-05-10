'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a NSC-agreed notification`, async () => {
    ctx.purses[challengerName].NSCAgreedPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onNSCAgreed((address) => {
        callbacks.onNSCAgreed(null);
        resolve({ address });
      });
    });
  });
};
