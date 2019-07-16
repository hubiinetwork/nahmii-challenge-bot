'use strict';

const chai = require('chai');
const expect = chai.expect;
const minikube = require('../utils/minikube');
const nahmii = require('nahmii-sdk');

module.exports = function (ctx) {
  step('Owner of contracts', async function () {
    ctx.Owner = new nahmii.Wallet(minikube.accounts.owner.privateKey, ctx.provider);
    this.test.title += `\n        ${ctx.Owner.address}`;
    expect(ctx.Owner).to.be.instanceof(nahmii.Wallet);
  });
};
