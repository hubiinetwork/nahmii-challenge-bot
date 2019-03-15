'use strict';

const chai = require('chai');
const expect = chai.expect;
const minikube = require('../utils/minikube');

module.exports = function (ctx) {
  step('Currencies', async () => {
    ctx.currencies = {
      ETH: await minikube.getCurrency('ETH'),
      HBT: await minikube.getCurrency('HBT')
    };
    expect(ctx.currencies.ETH).not.to.be.undefined;
    expect(ctx.currencies.HBT).not.to.be.undefined;
    expect(ctx.currencies.ETH.ct).not.to.be.undefined;
    expect(ctx.currencies.HBT.ct).not.to.be.undefined;
  });
};
