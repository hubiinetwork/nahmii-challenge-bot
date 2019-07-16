'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const { formatUnits, BigNumber } = require('ethers').utils;
const assert = require('assert');
const config = require('../../../../../src/config');

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  step(`${challengerName} DSC-start notification observed`, async function () {
    this.timeout(Math.max(2000 * config.services.confirmationsDepth, 8000));
    for (let i = 0; i < config.services.confirmationsDepth + 1; ++i)
      await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].DSCStartPromise).to.eventually.be.fulfilled;
  });

  step('DSC-start payload is valid', async function () {
    const { initiator, nonce, stagedAmount } = await ctx.purses[challengerName].DSCStartPromise;
    const unit = ctx.currencies[symbol].unit;
    expect(initiator).to.equal(ctx.wallets[walletName].address);
    expect(nonce).to.be.instanceOf(BigNumber);
    expect(formatUnits(stagedAmount, unit)).to.equal(stageAmount);
  });
};

