'use strict';

const chai = require('chai');
const minikube = require('../../utils/minikube');
const nahmii = require('nahmii-sdk');

module.exports = function (ctx) {
  step('Faucet source of ETH', () => {
    ctx.Faucet = new nahmii.Wallet(minikube.accounts.faucet.privateKey, ctx.provider);
    chai.expect(ctx.Faucet).to.be.instanceof(nahmii.Wallet);
  });
};
