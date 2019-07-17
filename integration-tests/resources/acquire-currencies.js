'use strict';

const chai = require('chai');
const expect = chai.expect;
const request = require('superagent');
const minikube = require('../utils/minikube');
const NahmiiProviderFactory = require('../../src/nahmii-provider-factory');

let _tokens;

async function getSupportedToken (symbol) {
  if (!_tokens) {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    const provider = await NahmiiProviderFactory.acquireProvider();
    const accessToken = await provider.getApiAccessToken();

    if (!accessToken)
      throw new Error('Failed to get access token.');

    const response = await request
      .get(`http://${minikube.baseUrl}/ethereum/supported-tokens`)
      .set('Content-Type', 'application/json')
      .set('authorization', `Bearer ${accessToken}`);

    _tokens = response.body;
  }

  return _tokens.find(currency => currency.symbol === symbol);
}

module.exports = function (ctx) {
  step('Currencies', async function () {
    this.timeout(16000);
    ctx.currencies = {};

    for (const symbol of ['ETH', 'T18', 'T15']) {
      ctx.currencies[symbol] = await minikube.getCurrency(symbol);
      const token = await getSupportedToken(symbol);
      expect(token).to.not.be.undefined;
      expect(token.symbol).to.equal(symbol);
      expect(token.currency).to.equal(ctx.currencies[symbol].ct);
    }
  });
};
