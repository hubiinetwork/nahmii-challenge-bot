'use strict';

const assert = require('assert');

function isRevertContractException(error) {
  return error.code === 'CALL_EXCEPTION' || error.code === -32000;
}

module.exports = function (ctx, walletName, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(symbol === 'ETH' || symbol === '???');

  step(`${walletName} has no NSC proposal status`, done => {
    ctx.contracts.nullSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, ctx.currencies[symbol].ct, 0)
    .then(res => done(res))
    .catch(err => isRevertContractException(err) ? done() : done(err));
  });
};
