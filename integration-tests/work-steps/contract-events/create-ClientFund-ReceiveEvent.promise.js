'use strict';

// Comments about events and ganache
// https://github.com/ethers-io/ethers.js/issues/283

module.exports = (ctx) => {
  step('Subscribe to ClientFund ReceiveEvent', async () => {
    ctx.promises.ReceiveEvent = new Promise(resolve => {
      console.log('ClientFund address: ' + ctx.contracts.clientFund.address);
      ctx.contracts.clientFund.once('ReceiveEvent', (wallet, balanceType, value, currencyCt, currencyId, standard, event) => {
        resolve({ wallet, balanceType, value, currencyCt, currencyId, standard, event });
      });
    });
  });
};

