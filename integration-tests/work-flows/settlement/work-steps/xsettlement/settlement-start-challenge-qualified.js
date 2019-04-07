'use strict';

const chai = require('chai');
const expect = chai.expect;
const nahmii = require('nahmii-sdk');
const { parseEther } = require('ethers').utils;

module.exports = function (ctx, walletName, stageAmount, symbol, settlementType) {
  step(`${walletName} starts challenge process`, async () => {
    const purse = ctx.purses[walletName];
    purse.settlement = new nahmii.Settlement(ctx.provider);
    purse.stagedAmount = nahmii.MonetaryAmount.from(parseEther(stageAmount), ctx.currencies[symbol].ct, 0);

    const txs = await purse.settlement.startChallenge(purse.stagedAmount, ctx.wallets[walletName], { gasLimit: ctx.gasLimit });

    expect(txs.length).to.gt(0);
    expect(txs[0].type).to.equal(settlementType);
  });
};
