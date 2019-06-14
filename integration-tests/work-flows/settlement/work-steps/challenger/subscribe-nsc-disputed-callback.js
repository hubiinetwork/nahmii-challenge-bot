'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a NSC-disputed notification`, async () => {
    ctx.purses[challengerName].NSCDisputedPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onNSCDisputed((initiatorAddress, finalReceipt, targetBalance) => {
        callbacks.onNSCDisputed(null);
        resolve({ initiatorAddress, finalReceipt, targetBalance });
      });
    });
  });
};
