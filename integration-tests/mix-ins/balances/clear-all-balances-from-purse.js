
'use strict';

module.exports = function (ctx, walletName) {
  step(`Clear all balances from ${walletName}'s purse`, async function () {
    const purse = ctx.purses[walletName];
    delete purse.onchainBalanceBeforeAction;
    delete purse.onchainBalanceAfterAction;
    delete purse.nahmiiBalanceBeforeAction;
    delete purse.nahmiiBalanceAfterAction;
    delete purse.stagedBalanceBeforeAction;
    delete purse.stagedBalanceAfterAction;
  });
};
