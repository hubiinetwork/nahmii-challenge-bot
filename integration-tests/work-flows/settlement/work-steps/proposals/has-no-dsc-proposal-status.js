'use strict';

function isRevertContractException(error) {
  return error.code === 'CALL_EXCEPTION' || error.code === -32000;
}

module.exports = function (ctx, walletName, symbol) {
  step(`${walletName} has no DSC proposal status`, done => {
    ctx.contracts.driipSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, ctx.currencies[symbol].ct, 0)
    .then(res => done(res))
    .catch(err => isRevertContractException(err) ? done() : done(err));
  });
};
