'use strict';

module.exports = async function (ctx, walletName) {
  require('./capture-l0-eth-balance')(ctx, `Capture ${walletName}'s on-chain balance before action`, walletName, 'onchainBalanceBeforeAction');
};
