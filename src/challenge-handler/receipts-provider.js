'use strict';

const NestedError = require('../utils/nested-error');

async function getWalletReceipts(provider, address) {
  try {
    return await provider.getWalletReceipts(address, null, 100);
  }
  catch (err) {
    throw new NestedError(err, `Could not retrieve receipts for address ${address}`);
  }
}

async function getWalletReceiptFromHash(provider, address, hash) {
  const receipts = await getWalletReceipts(provider, address);
  const filtered = receipts.filter(receipt => receipt.seals.operator.hash === hash);

  if (filtered.length === 0)
    throw new Error(`No receipts for address ${address} matches hash ${hash}`);

  return filtered[0];
}

async function getResentSenderReceipts(provider, sender, ct, id, minSenderNonce, minBlockNo) {
  const receipts = await getWalletReceipts(provider, sender);

  const filtered = receipts.filter(receipt =>
    (receipt.sender.wallet.toLowerCase() === sender.toLowerCase()) &&
    (receipt.currency.ct === ct) && (receipt.currency.id === id.toString()) &&
    (receipt.sender.nonce >= minSenderNonce) && (receipt.blockNumber >= minBlockNo)
  );

  return filtered;
}

module.exports = {
  getWalletReceipts,
  getWalletReceiptFromHash,
  getResentSenderReceipts
};