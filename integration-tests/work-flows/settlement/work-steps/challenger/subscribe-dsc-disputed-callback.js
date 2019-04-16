'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a DSC-disputed notification`, async () => {
    ctx.purses[challengerName].DSCDisputedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onDSCDisputed((initiatorAddress, finalReceipt, targetBalance) => {
        challenger.onDSCDisputed(null);
        resolve({ initiatorAddress, finalReceipt, targetBalance });
      });
    });
  });
};
