'use strict';

module.exports = async function (ctx, walletName, symbol) {
  require('/capture-latest-receipt')(ctx, `Capture ${walletName}'s latest receipt before`, walletName, 'receiptBefore', symbol);
};
