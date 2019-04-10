'use strict';
const { parseUnits } = require('ethers').utils;

const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  step (`${walletName} starts NSC that is rejected`, async () => {
    const currency = ctx.currencies[symbol];
    const contract = ctx.contracts.nullSettlementChallengeByPayment.connect(ctx.wallets[walletName]);
    const promise = contract.startChallenge(parseUnits(stageAmount, currency.unit), ctx.currencies[symbol].ct, 0, { gasLimit: ctx.gasLimit });

    return expect(promise).to.eventually.be.rejected;
  });
};
