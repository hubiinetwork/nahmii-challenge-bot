'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} expects a DSC-start notification`, async () => {
    ctx.purses[challengerName].DSCStartPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onDSCStart((initiator, nonce, stagedAmount) => {
        challenger.onDSCStart(null);
        resolve({ initiator, nonce, stagedAmount });
      });
    });
  });
};
