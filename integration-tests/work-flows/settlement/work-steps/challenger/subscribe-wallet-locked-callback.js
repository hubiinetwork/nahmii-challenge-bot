'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a wallet-locked notification`, async () => {
    ctx.purses[challengerName].WalletLockedPromise = new Promise(resolve => {
      const callbacks = ctx.wallets[challengerName].asChallenger.callbacks;
      callbacks.onWalletLocked((challengerWallet, lockedWallet, ct, id) => {
        callbacks.onWalletLocked(null);
        resolve({ challengerWallet, lockedWallet, ct, id });
      });
    });
  });
};
