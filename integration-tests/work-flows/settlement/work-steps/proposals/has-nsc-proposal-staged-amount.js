'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatUnits } = require('ethers').utils;
const assert = require('assert');

module.exports = function (ctx, walletName, stageAmount, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(`${walletName} has NSC proposal with staged amount: ${stageAmount} ${symbol}`, async () => {
    const wallet = ctx.wallets[walletName];
    const unit = ctx.currencies[symbol].unit;
    const proposalStageAmount = await ctx.contracts.nullSettlementChallengeByPayment.proposalStageAmount(wallet.address, ctx.currencies[symbol].ct, 0);

    expect(formatUnits(proposalStageAmount, unit)).to.equal(stageAmount);
  });
};
