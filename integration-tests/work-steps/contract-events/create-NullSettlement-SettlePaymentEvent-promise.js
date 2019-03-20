'use strict';

module.exports = (ctx) => {
  step('Create SettlePaymentEvent listener', async () => {
    ctx.promises.SettlePaymentEvent = new Promise(resolve => {
      ctx.contracts.nullSettlement.on('SettlePaymentEvent', (wallet, payment) => {
        resolve({ wallet, payment });
      });
    });
  });
};
