'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} expects a DSC-event notification`, async () => {
    ctx.purses[challengerName].DSCEventPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onDSCEvent((initiatorWallet, paymentHash, stagedAmount) => {
        challenger.onDSCEvent(null);
        resolve({ initiatorWallet, paymentHash, stagedAmount });
      });
    });
  });
};
