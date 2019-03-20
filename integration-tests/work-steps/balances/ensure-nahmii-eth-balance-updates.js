'use strict';

async function getNahmiiEthBalance(wallet) {
  const balances = await wallet.getNahmiiBalance();
  return (balances['ETH'] === undefined) ? '0.0' : balances['ETH'];
}

module.exports = function (ctx, walletName) {
  step(`Ensure ${walletName}'s nahmii balance updates`, async function () {
    const wallet = ctx.wallets[walletName];
    const blockNo0 = await ctx.provider.getBlockNumber();
    const balance0 = await getNahmiiEthBalance(wallet);

    await ctx.Miner.mineUntil(async () =>
      await balance0 !== await getNahmiiEthBalance(wallet)
    );

    const blockNo1 = await ctx.provider.getBlockNumber();
    this.test.title += `: ${blockNo0} - ${blockNo1}`;
  });
};
