'use strict';
/*global step :true*/

const assert = require('assert');

module.exports = function (ctx, challengerName) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');

  step(`${challengerName} subscribes a wallet-locked notification`, async () => {
    ctx.purses[challengerName].WalletLockedPromise = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onWalletLocked((challenger, lockedWallet, balance, ct, id) => {
        challenger.onWalletLocked(null);
        resolve({ challenger, lockedWallet, balance, ct, id });
      });
    });
  });
};
