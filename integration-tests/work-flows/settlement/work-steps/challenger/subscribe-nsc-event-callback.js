'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} expects a start NSC event`, async () => {
    ctx.purses[challengerName].NSCEventPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onNSCEvent((initiatorWallet, stagedAmount, stagedCt, stageId) => {
        challenger.onNSCEvent(null);
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });
};
