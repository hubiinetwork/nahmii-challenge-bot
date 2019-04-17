'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a wallet-locked notification`, async () => {
    ctx.purses[challengerName].WalletLockedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onWalletLocked((challengerWallet, lockedWallet, ct, id) => {
        challenger.onWalletLocked(null);
        resolve({ challengerWallet, lockedWallet, ct, id });
      });
    });
  });
};
