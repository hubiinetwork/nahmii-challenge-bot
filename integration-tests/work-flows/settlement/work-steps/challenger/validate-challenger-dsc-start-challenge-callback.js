'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatEther } = require('ethers').utils;

module.exports = function (ctx, challengerName, walletName, stageAmount) {
  step(`${challengerName} observed a StartChallengeFromPaymentEvent`, async function () {
    ctx.Miner.mineOneBlock();
    const purse = ctx.purses[challengerName];
    return expect(purse.StartChallengeFromPaymentEvent).to.eventually.be.fulfilled;
  });

  step('StartChallengeFromPaymentEvent payload is valid', async function () {
    const purse = ctx.purses[challengerName];
    const { initiatorWallet, paymentHash, stagedAmount } = await purse.StartChallengeFromPaymentEvent;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
  });
};

