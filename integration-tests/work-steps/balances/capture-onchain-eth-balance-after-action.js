'use strict';

module.exports = async function (ctx, walletName) {
  require('./capture-onchain-eth-balance')(ctx, `Capture ${walletName}'s on-chain balance after action`, walletName, 'onchainBalanceAfterAction');
};
