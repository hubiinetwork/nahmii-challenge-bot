'use strict';

module.exports = function (ctx, walletName) {
  require('./capture-staged-eth-balance')(ctx, `Capture ${walletName}'s staged balance after action`, walletName, 'stagedBalanceAfterAction');
};
