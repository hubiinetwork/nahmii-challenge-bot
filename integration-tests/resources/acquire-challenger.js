'use strict';

const chai = require('chai');
const nahmii = require('nahmii-sdk');
const ChallengeHandler = require('../../src/challenge-handler');

module.exports = function (ctx, walletName, assignedEth) {

  require('./acquire-actor')(ctx, walletName, assignedEth);

  step(`${walletName} takes role as challenger`, () => {
    chai.expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    ctx.wallets[walletName].asChallenger = new ChallengeHandler(
      ctx.wallets[walletName],
      ctx.gasLimit,
      ctx.contracts.clientFund,
      ctx.contracts.driipSettlementChallengeByPayment, ctx.contracts.nullSettlementChallengeByPayment,
      ctx.contracts.balanceTracker,
      ctx.contracts.driipSettlementDisputeByPayment, ctx.contracts.nullSettlementDisputeByPayment
    );
    chai.expect(ctx.wallets[walletName].asChallenger).to.be.instanceof(ChallengeHandler);
  });
};
