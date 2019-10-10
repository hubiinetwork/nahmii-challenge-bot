'use strict';
/*global step :true*/

const chai = require('chai');
const expect = chai.expect;
const { formatUnits } = require('ethers').utils;
const assert = require('assert');
const t = require('../../../../../src/runtime-types');
const config = require('../../../../../src/config');

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof challengerName === 'string');
  assert(typeof walletName === 'string');
  assert(typeof stageAmount === 'string');
  assert(typeof symbol === 'string');

  step(`${challengerName} NSC-start notification observed`, async function () {
    this.timeout(Math.max(2000 * config.services.confirmationsDepth, 8000));
    for (let i = 0; i < config.services.confirmationsDepth + 1; ++i)
      await ctx.Miner.mineOneBlock();
    return expect(ctx.purses[challengerName].NSCStartPromise).to.eventually.be.fulfilled;
  });

  step('NSC-start payload is valid', async function () {
    const { initiatorWallet, stagedAmount, stagedCt, stageId } = await ctx.purses[challengerName].NSCStartPromise;
    t.EthereumAddress().assert(initiatorWallet);
    t.EthersBigNumber().assert(stagedAmount);
    t.EthereumAddress().assert(stagedCt);
    t.EthersBigNumber().assert(stageId);

    const unit = ctx.currencies[symbol].unit;

    expect(initiatorWallet.isEqual(ctx.wallets[walletName].address)).to.be.true;
    expect(formatUnits(stagedAmount, unit)).to.equal(stageAmount);
    expect(stagedCt.isEqual(ctx.currencies[symbol].ct)).to.be.true;
    expect(stageId.toString()).to.equal('0');
  });
};

