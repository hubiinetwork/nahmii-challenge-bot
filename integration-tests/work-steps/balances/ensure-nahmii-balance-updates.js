'use strict';

async function getNahmiiBalance(wallet, symbol) {
  const balances = await wallet.getNahmiiBalance();
  return (balances[symbol] === undefined) ? '0.0' : balances[symbol];
}

module.exports = function (ctx, walletName, symbol) {
  if (!symbol)
    throw new Error('symbol undefined');

  step(`Ensure ${walletName}'s nahmii balance updates`, async function () {
    this.timeout(12000); // Sometimes takes excessive time

    const wallet = ctx.wallets[walletName];
    const blockNo0 = await ctx.provider.getBlockNumber();
    const balance0 = await getNahmiiBalance(wallet, symbol);

    await ctx.Miner.mineUntil(async () =>
      await balance0 !== await getNahmiiBalance(wallet, symbol)
    );

    const blockNo1 = await ctx.provider.getBlockNumber();
    this.test.title += `: ${blockNo0} - ${blockNo1}`;
  });
};
