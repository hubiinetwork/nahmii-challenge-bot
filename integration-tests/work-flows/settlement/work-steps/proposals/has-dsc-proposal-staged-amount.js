'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatUnits } = require('ethers').utils;

module.exports = function (ctx, walletName, stageAmount, symbol) {
  step(`${walletName} has DSC proposal with staged amount: ${stageAmount}`, async () => {
    const wallet = ctx.wallets[walletName];
    const unit = ctx.currencies[symbol].unit;
    const proposalStageAmount = await ctx.contracts.driipSettlementChallengeByPayment.proposalStageAmount(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(formatUnits(proposalStageAmount, unit)).to.equal(stageAmount);
  });
};
