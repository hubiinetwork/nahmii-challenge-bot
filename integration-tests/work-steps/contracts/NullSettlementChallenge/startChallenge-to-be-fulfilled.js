'use strict';

const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const { parseUnits } = require('ethers').utils;

module.exports = function (ctx, walletName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');


  step (`${walletName} starts NSC that is fulfilled`, async () => {
    const currency = ctx.currencies[symbol];
    const contract = ctx.contracts.nullSettlementChallenge.connect(ctx.wallets[walletName]);
    const promise = contract.startChallenge(parseUnits(stageAmount, currency.unit), currency.ct, currency.id, { gasLimit: ctx.gasLimit });

    return expect(promise).to.eventually.be.fulfilled;
  });
};
