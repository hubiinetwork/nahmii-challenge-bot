'use strict';

module.exports = function (ctx, walletName, symbol) {
  step(`${walletName} has NSC proposal with status: Qualified`, done => {
    ctx.contracts.nullSettlementChallengeByPayment.proposalStatus(ctx.wallets[walletName].address, ctx.currencies[symbol].ct, 0)
    .then(res => (res === 0) ? done() : done(res))
    .catch(err => done(err));
  });
};
