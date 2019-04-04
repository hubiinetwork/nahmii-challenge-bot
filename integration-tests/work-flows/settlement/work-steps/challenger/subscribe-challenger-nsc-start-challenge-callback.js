'use strict';

module.exports = function (ctx, challengerName) {
  step(`${challengerName} expects a start NSC event`, async () => {
    const purse = ctx.purses[challengerName];
    purse.StartNSCEvent = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onNSCEvent((initiatorWallet, stagedAmount, stagedCt, stageId) => {
        challenger.onNSCEvent(null);
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });
};
