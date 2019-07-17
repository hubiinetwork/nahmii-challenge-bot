'use strict';

const chai = require('chai');
const minikube = require('../utils/minikube');
const nahmii = require('nahmii-sdk');
const providerFactory = require('../../src/nahmii-provider-factory');

module.exports = function (ctx) {
  step('Provider', async () => {
    ctx.provider = await providerFactory.acquireProvider();
    chai.expect(ctx.provider).to.be.instanceof(nahmii.NahmiiProvider);

    // Increasing polling speed up from 4 sec in order to adapt to mining speed of ganache.
    // Pay care to ensure that tests does not not produce more than 12 blocks per poll iteration
    // since ethers will drop los/events that are deeper than 12 blocks.
    ctx.provider.pollingInterval = 1000;
    chai.expect(ctx.provider.pollingInterval).to.be.equal(1000);

    // Kick-start ethers polling loop by registering a dummy subscription
    ctx.provider.on('block', () => {});

    // Wait a bit so that ethers log-puller get a chance to start
    await new Promise(resolve => setTimeout(resolve, 500));
  });
};