'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, walletName, symbol) {
  step(`${walletName} has no DSC proposal nonce (throws)`, async () => {
    const wallet = ctx.wallets[walletName];
    expect(
      ctx.contracts.driipSettlementChallengeByPayment.proposalNonce(wallet.address, ctx.currencies[symbol].ct, 0)
    ).to.eventually.rejectedWith('VM Exception while processing transaction: revert');
  });
};