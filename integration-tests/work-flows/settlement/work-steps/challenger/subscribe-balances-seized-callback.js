'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a balances-seized notification`, async () => {
    ctx.purses[challengerName].BalancesSeizedPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onBalancesSeized((seizedWallet, seizerWallet, value, ct, id) => {
        callbacks.onBalancesSeized(null);
        resolve({ seizedWallet, seizerWallet, value, ct, id });
      });
    });
  });
};
