'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function(ctx, walletName, symbol) {
  step(`${walletName} has NSC proposal with updated a nonce`, async function () {
    const wallet = ctx.wallets[walletName];
    const nonce = await ctx.contracts.nullSettlementChallengeByPayment.proposalNonce(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(nonce.toNumber()).to.be.gte(0);
    this.test.title += `: ${nonce}`;
  });
};
