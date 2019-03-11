'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;
const minikube = require('../../utils/minikube');

function isRevertContractException(error) {
  return error.code === 'CALL_EXCEPTION' || error.code === -32000;
}

module.exports = function (ctx, walletName, stageAmount, symbol) {
  let currency;

  before(async () => {
    currency = await minikube.getCurrency(symbol);
  });

  step('Create StartChallengeEvent listener', async () => {
    ctx.nextStartChallengePromise = new Promise(resolve => {
      ctx.contracts.nullSettlementChallenge.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step(`${walletName} has no proposal status`, done => {
    ctx.contracts.nullSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, currency.ct, 0)
    .then(res => done(res))
    .catch(err => isRevertContractException(err) ? done() : done(err));
  });

  require('../balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../balances/capture-staged-balance-before-action')(ctx, walletName, symbol);

  step(`${walletName} has no proposal nonce (throws)`, async () => {
    const wallet = ctx.wallets[walletName];
    expect(
      ctx.contracts.nullSettlementChallenge.proposalNonce(wallet.address, currency.ct, 0)
    ).to.eventually.rejectedWith('VM Exception while processing transaction: revert');
  });

  step(`${walletName} starts challenge process`, async () => {
    const purse = ctx.purses[walletName];
    purse.settlement = new nahmii.Settlement(ctx.provider);
    purse.stagedAmount = new nahmii.MonetaryAmount(parseEther(stageAmount), currency.ct, 0);

    const txs = await purse.settlement.startChallenge(purse.stagedAmount, ctx.wallets[walletName]);

    expect(txs.length).to.equal(1);
    expect(txs[0].type).to.equal('null');
  });

  step(`${walletName} has proposal with status: Qualified`, done => {
    ctx.contracts.nullSettlementChallenge.proposalStatus(ctx.wallets[walletName].address, currency.ct, 0)
    .then(res => (res === 0) ? done() : done(res))
    .catch(err => done(err));
  });

  step(`${walletName} has proposal with staged amount: ${stageAmount}`, async () => {
    const wallet = ctx.wallets[walletName];
    const proposalStageAmount = await ctx.contracts.nullSettlementChallenge.proposalStageAmount(wallet.address, currency.ct, 0);
    expect(formatEther(proposalStageAmount)).to.equal(stageAmount);
  });

  step(`${walletName} has proposal with updated a nonce`, async () => {
    const wallet = ctx.wallets[walletName];
    const nonce = await ctx.contracts.nullSettlementChallenge.proposalNonce(wallet.address, currency.ct, 0);
    expect(nonce.toNumber()).to.be.gt(0);
  });

  step('StartChallengeEvent is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(ctx.nextStartChallengePromise).to.eventually.be.fulfilled;
  });

  step('StartChallengeEvent payload is valid', async function () {
    const { initiatorWallet, stagedAmount, stagedCt, stageId } = await ctx.nextStartChallengePromise;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
    expect(stagedCt).to.equal(currency.ct);
    expect(stageId.toString()).to.equal('0');
  });

  require('../balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol, null);
  require('../balances/capture-staged-balance-after-action')(ctx, walletName, symbol, null);

  require('../balances/verify-nahmii-balance-change')(ctx, walletName, symbol, '0.0');
  require('../balances/verify-staged-balance-change')(ctx, walletName, symbol, '0.0');
};
