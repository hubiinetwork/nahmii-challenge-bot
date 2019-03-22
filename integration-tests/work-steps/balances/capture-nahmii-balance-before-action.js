'use strict';

module.exports = function (ctx, walletName, symbol) {
  if (!symbol)
    throw new Error('symbol undefined');

  require('./capture-nahmii-balance')(
    ctx, `Capture ${walletName}'s nahmii balance before action`, walletName, 'nahmiiBalanceBeforeAction', symbol
  );
};
