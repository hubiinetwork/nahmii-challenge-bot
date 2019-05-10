'use strict';

const chai = require('chai');
const nahmii = require('nahmii-sdk');

const minikube = require('../utils/minikube');
const config = require('../../src/config');

config.services.baseUrl = minikube.baseUrl;
config.identity.appId = minikube.appId;
config.identity.appSecret = minikube.appSecret;
config.ethereum.nodeUrl = minikube.nodeUrl;

const ChallengeHandler = require('../../src/challenge-handler');
const ChallengeHandlerFactory = require('../../src/challenge-handler/challenge-handler-factory');

module.exports = function (ctx, walletName, assignedEth) {

  require('./acquire-actor')(ctx, walletName, assignedEth);

  step(`${walletName} takes role as challenger`, async () => {
    chai.expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    ctx.wallets[walletName].asChallenger = await ChallengeHandlerFactory.create(ctx.wallets[walletName], ctx.gasLimit);
    chai.expect(ctx.wallets[walletName].asChallenger).to.be.instanceof(ChallengeHandler);
  });
};
