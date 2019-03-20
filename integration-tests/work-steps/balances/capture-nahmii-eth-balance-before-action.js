'use strict';

module.exports = function (ctx, walletName) {
  require('./capture-nahmii-eth-balance')(ctx, `Capture ${walletName}'s nahmii balance before action`, walletName, 'nahmiiBalanceBeforeAction');
};
