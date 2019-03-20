'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;
const minikube = require('../utils/minikube');

function isRevertContractException(error) {
  return error.code === 'CALL_EXCEPTION' || error.code === -32000;
}

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {

  step(`${challengerName} expects a StartChallengeEvent`, async () => {
    const purse = ctx.purses[challengerName];
    purse.StartChallengeEvent = new Promise(resolve => {
      const challenger = ctx.wallets[challengerName].asChallenger;
      challenger.onStartChallengeEvent((initiatorWallet, stagedAmount, stagedCt, stageId) => {
        challenger.onStartChallengeEvent(null);
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step(`${walletName} has no proposal status`, done => {
    ctx.contracts.nullSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, ctx.currencies[symbol].ct, 0)
    .then(res => done(res))
    .catch(err => isRevertContractException(err) ? done() : done(err));
  });

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, walletName);
  require('../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  step(`${walletName} has no proposal nonce (throws)`, async () => {
    const wallet = ctx.wallets[walletName];
    expect(
      ctx.contracts.nullSettlementChallenge.proposalNonce(wallet.address, ctx.currencies[symbol].ct, 0)
    ).to.eventually.rejectedWith('VM Exception while processing transaction: revert');
  });

  step(`${walletName} starts challenge process`, async () => {
    const purse = ctx.purses[walletName];
    purse.settlement = new nahmii.Settlement(ctx.provider);
    purse.stagedAmount = nahmii.MonetaryAmount.from(parseEther(stageAmount), ctx.currencies[symbol].ct, 0);

    const txs = await purse.settlement.startChallenge(purse.stagedAmount, ctx.wallets[walletName]);

    expect(txs.length).to.equal(1);
    expect(txs[0].type).to.equal('null');
  });

  step(`${walletName} has proposal with status: Qualified`, done => {
    ctx.contracts.nullSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, ctx.currencies[symbol].ct, 0)
    .then(res => (res === 0) ? done() : done(res))
    .catch(err => done(err));
  });

  step(`${walletName} has proposal with staged amount: ${stageAmount}`, async () => {
    const wallet = ctx.wallets[walletName];
    const proposalStageAmount = await ctx.contracts.nullSettlementChallenge.proposalStageAmount(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(formatEther(proposalStageAmount)).to.equal(stageAmount);
  });

  step(`${walletName} has proposal with updated a nonce`, async function () {
    const wallet = ctx.wallets[walletName];
    const nonce = await ctx.contracts.nullSettlementChallenge.proposalNonce(wallet.address, ctx.currencies[symbol].ct, 0);
    expect(nonce.toNumber()).to.be.gt(0);
    this.test.title += `: ${nonce}`;
  });

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

  require('../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, walletName, null);
  require('../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, walletName, '0.0');
  require('../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, '0.0');
};
