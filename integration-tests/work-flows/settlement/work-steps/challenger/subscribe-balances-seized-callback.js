'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a balances-seized notification`, async () => {
    ctx.purses[challengerName].BalancesSeizedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onBalancesSeized((seizedWallet, seizerWallet, value, ct, id) => {
        challenger.onBalancesSeized(null);
        resolve({ seizedWallet, seizerWallet, value, ct, id });
      });
    });
  });
};
