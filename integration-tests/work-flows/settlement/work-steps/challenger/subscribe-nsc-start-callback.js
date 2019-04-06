'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} expects a NSC-start notification`, async () => {
    ctx.purses[challengerName].NSCStartPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onNSCStart((initiatorWallet, stagedAmount, stagedCt, stageId) => {
        challenger.onNSCStart(null);
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });
};
