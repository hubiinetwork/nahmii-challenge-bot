'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatEther } = require('ethers').utils;

module.exports = function (ctx, challengerName, walletName, stageAmount) {
  step(`${challengerName} observed a start DSC event`, async function () {
    return expect(
      ctx.Miner.mineOneBlock().then(() => {
        const purse = ctx.purses[challengerName];
        return purse.StartDSCEvent;
      })
    ).to.eventually.be.fulfilled;
  });

  step('Start DSC event payload is valid', async function () {
    const purse = ctx.purses[challengerName];
    const { initiatorWallet, stagedAmount } = await purse.StartDSCEvent;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
  });
};

