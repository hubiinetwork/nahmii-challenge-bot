'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a NSC-disputed notification`, async () => {
    ctx.purses[challengerName].NSCDisputedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onNSCDisputed((initiatorAddress, finalReceipt, targetBalance) => {
        challenger.onNSCDisputed(null);
        resolve({ initiatorAddress, finalReceipt, targetBalance });
      });
    });
  });
};
