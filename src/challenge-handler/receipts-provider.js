'use strict';

const NestedError = require('../utils/nested-error');

async function getWalletReceipts(provider, address) {
  try {
    return await provider.getWalletReceipts(address, null, 100);
  }
  catch (err) {
    throw new NestedError(err, `Could not retrieve receipts for address ${address}. ${err.message}`);
  }
}

async function getWalletReceiptFromNonce(provider, address, nonce) {

  if (typeof nonce !== 'number')
    throw new TypeError('Nonce must be of type number');

  const receipts = await getWalletReceipts(provider, address);
  const lcAddress = address.toLowerCase();

  const filtered = receipts.filter(receipt =>
    (receipt.sender.wallet.toLowerCase() === lcAddress && receipt.sender.nonce === nonce) ||
    (receipt.recipient.wallet.toLowerCase() === lcAddress && receipt.recipient.nonce === nonce)
  );

  if (filtered.length === 0)
    throw new Error(`No receipts for address ${address} matches nonce ${nonce}`);

  return filtered[0];
}

async function getResentSenderReceipts(provider, sender, ct, id, minSenderNonce, minBlockNo) {
  const receipts = await getWalletReceipts(provider, sender);
  const lcSender = sender.toLowerCase();

  const filtered = receipts.filter(receipt =>
    (receipt.sender.wallet.toLowerCase() === lcSender) &&
    (receipt.currency.ct === ct) && (receipt.currency.id === id.toString()) &&
    (receipt.sender.nonce >= minSenderNonce) && (receipt.blockNumber >= minBlockNo)
  );

  return filtered;
}

module.exports = {
  getWalletReceipts,
  getWalletReceiptFromNonce,
  getResentSenderReceipts
};