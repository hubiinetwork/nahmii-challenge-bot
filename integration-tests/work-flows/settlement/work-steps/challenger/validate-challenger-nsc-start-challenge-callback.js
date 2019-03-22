'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatEther } = require('ethers').utils;

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {
  step(`${challengerName} observed a StartChallengeEvent`, async function () {
    ctx.Miner.mineOneBlock();
    const purse = ctx.purses[challengerName];
    return expect(purse.StartChallengeEvent).to.eventually.be.fulfilled;
  });

  step('StartChallengeEvent payload is valid', async function () {
    const purse = ctx.purses[challengerName];
    const { initiatorWallet, stagedAmount, stagedCt, stageId } = await purse.StartChallengeEvent;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
    expect(stagedCt).to.equal(ctx.currencies[symbol].ct);
    expect(stageId.toString()).to.equal('0');
  });
};

