'use strict';

const chai = require('chai');
const expect = chai.expect;

function getTimestamp (receipt) {
  const timestamp = (new Date(receipt.created)).valueOf();
  return timestamp;
}

async function getTimestampOfLatestReceipt(ctx, walletName, symbol) {
  const wallet = ctx.wallets[walletName];
  const ct = ctx.currencies[symbol].ct;
  const receipts = await ctx.provider.getWalletReceipts(wallet.address, null, 100);
  const latestReceipt = receipts.filter(r => r.currency.ct === ct).sort((a, b) => getTimestamp(b) - getTimestamp(a));
  return latestReceipt.length === 0 ? -1 : getTimestamp(latestReceipt);
}

module.exports = function (ctx, walletName, symbol) {
  step(`Ensure ${walletName}'s latest receipt updates`, async function () {
    const t0 = await getTimestampOfLatestReceipt(ctx, walletName, symbol);
    return expect(ctx.Miner.mineUntil(async () => {
      const t1 = await getTimestampOfLatestReceipt(ctx, walletName, symbol);
      return t0 !== t1;
    })).to.eventually.be.fulfilled;
  });
};
