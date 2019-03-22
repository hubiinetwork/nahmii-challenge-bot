'use strict';

module.exports = function (ctx, challengerName) {
  step(`${challengerName} expects a StartChallengeFromPaymentEvent`, async () => {
    const purse = ctx.purses[challengerName];
    purse.StartChallengeFromPaymentEvent = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onStartChallengeFromPaymentEvent((initiatorWallet, paymentHash, stagedAmount) => {
        challenger.onStartChallengeFromPaymentEvent(null);
        resolve({ initiatorWallet, paymentHash, stagedAmount });
      });
    });
  });
};
