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

  step(`${walletName} listenes to StartChallengeFromPaymentEvent`, async () => {
    ctx.contracts.driipSettlementChallenge.on('StartChallengeFromPaymentEvent', (initiatorWallet, paymentHash, stagedAmount) => {
      ctx.wallets[walletName].asChallenger.handleDriipSettlementChallenge(initiatorWallet, paymentHash, stagedAmount);
    });
  });

  step(`${walletName} listenes to StartChallengeFromPaymentByProxyEvent`, async () => {
    ctx.contracts.driipSettlementChallenge.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
      ctx.wallets[walletName].asChallenger.handleDriipSettlementChallenge(initiatorWallet, paymentHash, stagedAmount);
    });
  });

  step(`${walletName} listenes to StartChallengeEvent`, () => {
    ctx.contracts.nullSettlementChallenge.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
      ctx.wallets[walletName].asChallenger.handleNullSettlementChallenge(initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  });

  step(`${walletName} listenes to StartChallengeByProxyEvent`, () => {
    ctx.contracts.nullSettlementChallenge.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
      ctx.wallets[walletName].asChallenger.handleNullSettlementChallenge(initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  });
};
