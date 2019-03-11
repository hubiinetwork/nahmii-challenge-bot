'use strict';

const chai = require('chai');
const expect = chai.expect;

const minikube = require('../../utils/minikube');

module.exports = function (ctx, walletName, settleAmount, symbol) {
  let nextStageEventPromise, nextSettleNullEventPromise;
  let currency;

  before(async () => {
    currency = await minikube.getCurrency(symbol);
  });

  step('Create StageEvent listener', async () => {
    nextStageEventPromise = new Promise(resolve => {
      ctx.contracts.clientFund.on('StageEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step('Create SettleNullEvent listener', async () => {
    nextSettleNullEventPromise = new Promise(resolve => {
      ctx.contracts.nullSettlement.on('SettleNullEvent', (wallet, currencyCt, currencyId) => {
        resolve({ wallet, currencyCt, currencyId });
      });
    });
  });

  require('../balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);
  require('../balances/capture-staged-balance-before-action')(ctx, walletName, symbol);


  step(`${walletName} settles staged amount`, async () => {
    const purse = ctx.purses[walletName];
    const settledChallenges = await purse.settlement.settle(currency.ct, 0, ctx.wallets[walletName], {gasLimit: 6e6});
    expect(settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(Array.isArray(settledChallenges)).to.be.true;
  });

  step('StageEvent event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(nextStageEventPromise).to.eventually.be.fulfilled;
  });

  step('SettleNullEvent event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(nextSettleNullEventPromise).to.eventually.be.fulfilled;
  });

  require('../balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol, null);
  require('../balances/capture-staged-balance-after-action')(ctx, walletName, symbol, null);

  require('../balances/verify-nahmii-balance-change')(ctx, walletName, symbol, '0.0');
  require('../balances/verify-staged-balance-change')(ctx, walletName, symbol, '0.0');
};
