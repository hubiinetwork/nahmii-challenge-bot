'use strict';

module.exports = function (ctx, challengerName) {
  step(`${challengerName} expects a StartChallengeEvent`, async () => {
    const purse = ctx.purses[challengerName];
    purse.StartChallengeEvent = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onStartChallengeEvent((initiatorWallet, stagedAmount, stagedCt, stageId) => {
        challenger.onStartChallengeEvent(null);
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });
};
