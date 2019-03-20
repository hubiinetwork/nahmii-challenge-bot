'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, walletName, symbol) {
  step(`Capture ${walletName}'s proposal expiration time`, async function () {
    const wallet = ctx.wallets[walletName];
    const proposalExpirationTime = await ctx.contracts.nullSettlementChallenge.proposalExpirationTime(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(proposalExpirationTime).to.be.instanceof(ethers.utils.BigNumber);
    ctx.purses[walletName].proposalExpirationTime = proposalExpirationTime.toNumber();
  });
};
