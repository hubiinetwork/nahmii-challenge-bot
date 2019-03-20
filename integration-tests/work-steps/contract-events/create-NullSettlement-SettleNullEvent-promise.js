'use strict';

module.exports = function (ctx) {
  step('Create SettleNullEvent listener', async () => {
    ctx.promises.SettleNullEvent = new Promise(resolve => {
      ctx.contracts.nullSettlement.on('SettleNullEvent', (wallet, currencyCt, currencyId) => {
        resolve({ wallet, currencyCt, currencyId });
      });
    });
  });
}