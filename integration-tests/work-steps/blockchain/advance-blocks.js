
'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = function (ctx, blockCount) {
  step(`Advance ${blockCount} blocks`, async function () {

    const blockNo0 = await ctx.provider.getBlockNumber();
    await ctx.Miner.mineUntil(async () =>
      await ctx.provider.getBlockNumber() - blockNo0 >= blockCount
    );

/*
    const ethersBlockLimit = 12; // Ethers discards events more than 12 blocks old
    const miningInterval = 2 * ctx.provider.pollingInterval / ethersBlockLimit;

    const blockNo0 = await ctx.provider.getBlockNumber();

    await ctx.provider.send('evm_mine', []);
    for (let i = 0; i < blockCount; ++i) {
      process.stdout.write(`${await ctx.provider.getBlockNumber()}\r`);
      await new Promise(resolve => setTimeout(resolve, miningInterval));
      await ctx.provider.send('evm_mine', []);
    }
*/
    const blockNo1 = await ctx.provider.getBlockNumber();

    this.test.title += `: ${blockNo0} - ${blockNo1}`;

    expect(blockNo1 - blockNo0).to.gte(blockCount);
  });
};
