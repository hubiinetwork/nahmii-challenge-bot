'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} expects a NSC-start notification`, async () => {
    ctx.purses[challengerName].NSCStartPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onNSCStart((initiatorWallet, stagedAmount, stagedCt, stageId) => {
        callbacks.onNSCStart(null);
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });
};
