'use strict';

module.exports = function (ctx, walletName, symbol) {
  step(`${walletName} has proposal with status: Qualified`, done => {
    ctx.contracts.nullSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, ctx.currencies[symbol].ct, 0)
    .then(res => (res === 0) ? done() : done(res))
    .catch(err => done(err));
  });
};
