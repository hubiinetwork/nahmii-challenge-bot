'use strict';

module.exports = async function (ctx, title, walletName, receiptName, symbol) {
  step(title, async function () {
    const wallet = ctx.wallets[walletName];
    const purse = ctx.purses[walletName];
    const ct = ctx.currencies[symbol].ct;

    const receipts = await ctx.provider.getWalletReceipts(wallet.address, null, 100);
    const filteredReceipts = receipts.filter(r => r.currency.ct === ct).sort((a, b) => b.nonce - a.nonce);
    purse[receiptName] = filteredReceipts.length ? filteredReceipts[0] : null;

    const nonce = purse[receiptName] === null ? -1 : purse[receiptName].nonce;
    this.test.title += `: ${nonce}`;
  });
};
