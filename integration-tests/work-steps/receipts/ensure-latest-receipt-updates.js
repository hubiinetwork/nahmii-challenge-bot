'use strict';

const chai = require('chai');
const expect = chai.expect;

async function getNonceOfLatestReceipt(ctx, walletName, symbol) {
  const wallet = ctx.wallets[walletName];
  const ct = ctx.currencies[symbol].ct;
  const receipts = await ctx.provider.getWalletReceipts(wallet.address, null, 100);
  const latestReceipt = receipts.filter(r => r.currency.ct === ct).sort((a, b) => b.nonce - a.nonce);
  return latestReceipt.length === 0 ? -1 : latestReceipt[0].nonce;
}

module.exports = function (ctx, walletName, symbol) {
  step(`Ensure ${walletName}'s latest receipt updates`, async function () {
    const nonce0 = await getNonceOfLatestReceipt(ctx, walletName, symbol);
    return expect(ctx.Miner.mineUntil(async () => {
      const nonce1 = await getNonceOfLatestReceipt(ctx, walletName, symbol);
      return nonce0 !== nonce1;
    })).to.eventually.be.fulfilled;
  });
};
