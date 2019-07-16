'use strict';

const chai = require('chai');
const nahmii = require('nahmii-sdk');
const assert = require('assert');

const minikube = require('../utils/minikube');
const config = require('../../src/config');
config.services.baseUrl = minikube.baseUrl;
config.identity.appId = minikube.appId;
config.identity.appSecret = minikube.appSecret;
config.ethereum.nodeUrl = minikube.nodeUrl;

const ChallengeHandler = require('../../src/challenge-handler');
const ChallengeHandlerFactory = require('../../src/challenge-handler/challenge-handler-factory');

module.exports = function (ctx, walletName, assignedAmountArr, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(Array.isArray(assignedAmountArr));
  assert(assignedAmountArr.length >= 1);
  for (let i = 0; i < assignedAmountArr.length; ++i)
    assert(assignedAmountArr[i].length === 2);
  assert(dummy === undefined);

  require('./acquire-actor')(ctx, walletName, assignedAmountArr);

  step(`${walletName} takes role as challenger`, async () => {
    chai.expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    ctx.wallets[walletName].asChallenger = await ChallengeHandlerFactory.create(ctx.wallets[walletName], ctx.gasLimit);
    chai.expect(ctx.wallets[walletName].asChallenger).to.be.instanceof(ChallengeHandler);
  });
};
