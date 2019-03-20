'use strict';

const chai = require('chai');
const nahmii = require('nahmii-sdk');
const ChallengeHandler = require('../../src/challenge-handler');

module.exports = function (ctx, walletName, assignedEth) {

  require('./acquire-actor')(ctx, walletName, assignedEth);

  step(`${walletName} takes role as challenger`, () => {
    chai.expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    ctx.wallets[walletName].asChallenger = new ChallengeHandler(
      ctx.wallets[walletName], ctx.contracts.driipSettlementChallenge, ctx.contracts.nullSettlementChallenge
    );
    chai.expect(ctx.wallets[walletName].asChallenger).to.be.instanceof(ChallengeHandler);
  });
};