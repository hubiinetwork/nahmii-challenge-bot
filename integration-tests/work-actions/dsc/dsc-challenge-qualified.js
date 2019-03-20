'use strict';

const chai = require('chai');
const expect = chai.expect;

const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const { parseEther } = ethers.utils;

module.exports = function (ctx, challengerName, walletName, stageAmount, symbol) {

  require('../../../../work-steps/challenger/subscribe-nsc-start-challenge-event')(ctx, challengerName);

  require('../../../../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../../../../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../../../../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, walletName);
  require('../../../../work-steps/balances/capture-staged-eth-balance-before-action')(ctx, walletName);

  require('../../../../work-steps/proposals/has-no-nsc-proposal-status')(ctx, walletName, symbol);
  require('../../../../work-steps/proposals/has-no-nsc-proposal-nonce')(ctx, walletName, symbol);

  step(`${walletName} starts challenge process`, async () => {
    const purse = ctx.purses[walletName];
    purse.settlement = new nahmii.Settlement(ctx.provider);
    purse.stagedAmount = nahmii.MonetaryAmount.from(parseEther(stageAmount), ctx.currencies[symbol].ct, 0);

    const txs = await purse.settlement.startChallenge(purse.stagedAmount, ctx.wallets[walletName]);

    expect(txs.length).to.equal(1);
    expect(txs[0].type).to.equal('null');
  });

  require('../../../../work-steps/proposals/has-nsc-proposal-status-qualified')(ctx, walletName, symbol);
  require('../../../../work-steps/proposals/has-nsc-proposal-nonce')(ctx, walletName, symbol);
  require('../../../../work-steps/proposals/has-nsc-proposal-staged-amount')(ctx, walletName, stageAmount, symbol);

  require('../../../../work-steps/challenger/observed-nsc-start-challenge-event')(ctx, challengerName, walletName, stageAmount, symbol);

  require('../../../../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);
  require('../../../../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, walletName, null);
  require('../../../../work-steps/balances/capture-staged-eth-balance-after-action')(ctx, walletName, null);

  require('../../../../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, walletName, '0.0');
  require('../../../../work-steps/balances/verify-staged-eth-balance-change')(ctx, walletName, '0.0');
};
