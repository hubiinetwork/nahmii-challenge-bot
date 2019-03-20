'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, walletName, settleAmount, symbol) {

  step('Create StageEvent listener', async () => {
    ctx.promises.StageEvent = new Promise(resolve => {
      ctx.contracts.clientFund.on('StageEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step('Create SettleNullEvent listener', async () => {
    ctx.promises.SettleNullEvent = new Promise(resolve => {
      ctx.contracts.nullSettlement.on('SettleNullEvent', (wallet, currencyCt, currencyId) => {
        resolve({ wallet, currencyCt, currencyId });
      });
    });
  });

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, walletName);
  require('../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  step(`${walletName} has proposal with timeout`, async () => {
    const wallet = ctx.wallets[walletName];
    const proposalExpirationTime = await ctx.contracts.nullSettlementChallenge.proposalExpirationTime(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(proposalExpirationTime).to.be.instanceof(ethers.utils.BigNumber);
    ctx.purses[walletName].proposalExpirationTime = proposalExpirationTime.toNumber();
  });

  step('Advance blockchain', async function () {

    const blockChainNow = (await ctx.provider.getBlock('latest')).timestamp;

    const proposalExpire = ctx.purses[walletName].proposalExpirationTime;
    await ctx.Miner.mineOneBlock();
    await ctx.Miner.advanceTime(proposalExpire - blockChainNow);
    await ctx.Miner.mineOneBlock();
    const blockChainNext = (await ctx.provider.getBlock('latest')).timestamp;

    expect(proposalExpire - blockChainNext).to.be.lt(1);
    this.test.title += `: ${proposalExpire - blockChainNow} s`;
  });

  step(`${walletName} settles staged amount`, async () => {
    const purse = ctx.purses[walletName];
    purse.settledChallenges = await purse.settlement.settle(ctx.currencies[symbol].ct, 0, ctx.wallets[walletName], {gasLimit: 6e6});
    expect(purse.settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step(`${walletName} got settlement confirmation`, async () => {
    const purse = ctx.purses[walletName];
    expect(Array.isArray(purse.settledChallenges)).to.be.true;
    expect(purse.settledChallenges.length).to.be.gt(0); // Something must have been settled
  });

  step('SettleNullEvent event is emitted', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.SettleNullEvent).to.eventually.be.fulfilled;
  });

  step('StageEvent event is emitted', async function () {
    ctx.Miner.mineOneBlock();
    return expect(ctx.promises.StageEvent).to.eventually.be.fulfilled;
  });

  require('../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, walletName, null);
  require('../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, walletName, '0.0');
  require('../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, settleAmount);
};
