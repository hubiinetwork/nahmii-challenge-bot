'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatEther } = require('ethers').utils;

module.exports = function (ctx, walletName, stageAmount, symbol) {
  step(`${walletName} has proposal with staged amount: ${stageAmount}`, async () => {
    const wallet = ctx.wallets[walletName];
    const proposalStageAmount = await ctx.contracts.nullSettlementChallenge.proposalStageAmount(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(formatEther(proposalStageAmount)).to.equal(stageAmount);
  });
};
