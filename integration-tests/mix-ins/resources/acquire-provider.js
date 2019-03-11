'use strict';

const chai = require('chai');
const minikube = require('../../utils/minikube');
const nahmii = require('nahmii-sdk');

module.exports = function (ctx) {
  step('Provider', async () => {
    ctx.provider = new nahmii.NahmiiProvider(minikube.baseUrl, minikube.appId, minikube.appSecret, minikube.nodeUrl, 'ropsten');
    chai.expect(ctx.provider).to.be.instanceof(nahmii.NahmiiProvider);
  });
};