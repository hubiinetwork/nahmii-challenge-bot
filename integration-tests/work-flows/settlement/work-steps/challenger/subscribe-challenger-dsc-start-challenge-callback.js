'use strict';

module.exports = function (ctx, challengerName) {
  step(`${challengerName} expects a start DSC event`, async () => {
    const purse = ctx.purses[challengerName];
    purse.StartDSCEvent = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onDSCEvent((initiatorWallet, paymentHash, stagedAmount) => {
        challenger.onDSCEvent(null);
        resolve({ initiatorWallet, paymentHash, stagedAmount });
      });
    });
  });
};
