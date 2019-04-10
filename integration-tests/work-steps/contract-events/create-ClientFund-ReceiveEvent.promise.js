'use strict';

// Comments about events and ganache
// https://github.com/ethers-io/ethers.js/issues/283

/*
let triggerPromise = new Promise((resolve, reject) => {
  eventContract.addListener("TestEvent", (a, b, event) => {
    console.log(a);
    console.log(b);
    console.log(event);

    // Optionally place any asserts here...

    // Stop listening; maybe not necessary, but it's nice to clean up a bit
    event.removeListener();

    // All is well, the event was triggered
    resolve();
  });

  // After 30s, we throw a timeout error
  setTimeout(() => {
    reject(new Error('timeout while waiting for event'));
  }, 30000);
});
*/

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

