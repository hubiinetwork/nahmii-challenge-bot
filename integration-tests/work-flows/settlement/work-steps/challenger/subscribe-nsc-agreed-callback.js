'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a NSC-agreed notification`, async () => {
    ctx.purses[challengerName].NSCAgreedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onNSCAgreed((address) => {
        challenger.onNSCAgreed(null);
        resolve({ address });
      });
    });
  });
};
