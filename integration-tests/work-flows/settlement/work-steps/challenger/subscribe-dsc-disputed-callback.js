'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a DSC-disputed notification`, async () => {
    ctx.purses[challengerName].DSCDisputedPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onDSCDisputed((initiatorAddress, finalReceipt, targetBalance) => {
        callbacks.onDSCDisputed(null);
        resolve({ initiatorAddress, finalReceipt, targetBalance });
      });
    });
  });
};
