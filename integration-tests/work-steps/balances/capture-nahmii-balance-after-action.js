'use strict';

module.exports = function (ctx, walletName, symbol) {
  if (!symbol)
    throw new Error('symbol undefined');

  require('./capture-nahmii-balance')(
    ctx, `Capture ${walletName}'s nahmii balance after action`, walletName, 'nahmiiBalanceAfterAction', symbol
  );
};

