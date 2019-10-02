'use strict';

const NestedError = require('../../utils/nested-error');
const { BigNumber } = require('ethers').utils;

function getParty (wallet, receipt) {
  if (wallet.toLowerCase() === receipt.sender.wallet.toLowerCase())
    return receipt.sender;
  if (wallet.toLowerCase() === receipt.recipient.wallet.toLowerCase())
    return receipt.recipient;

  throw new Error('Unexpected wallet. Wallet not party of receipt.');
}

async function getWalletReceipts(provider, wallet) {
  try {
    return (await provider.getWalletReceipts(wallet, null, 100))
      .map(receipt => {
        receipt.party = getParty(wallet, receipt);
        return receipt;
      });
  }
  catch (err) {
    throw new NestedError(err, `Could not retrieve receipts for address ${wallet}. ${err.message}`);
  }
}

async function getWalletReceiptFromNonce(provider, wallet, nonce) {
  if (!(nonce instanceof BigNumber))
    throw new TypeError('Expected nonce to be of type BigNumber');

  const receipts = await getWalletReceipts(provider, wallet);

  const filtered = receipts.filter(receipt => nonce.eq(receipt.party.nonce));

  if (filtered.length !== 1)
    throw new Error(`Expected exactly one receipt for address ${wallet} to match nonce ${nonce}`);

  return filtered[0];
}

async function getRecentWalletReceipts(provider, wallet, ct, id, minSenderNonce, minBlockNo) {
  if (!(minSenderNonce instanceof BigNumber))
    throw new TypeError('Expected nonce to be of type BigNumber');

  const receipts = await getWalletReceipts(provider, wallet);

  const filtered = receipts.filter(receipt => {
    return (receipt.currency.ct.toLowerCase() === ct.toLowerCase()) && (receipt.currency.id === id.toString()) &&
    minSenderNonce.lte(receipt.party.nonce) && (receipt.blockNumber >= minBlockNo);
  });

  return filtered;
}

module.exports = {
  getWalletReceipts,
  getWalletReceiptFromNonce,
  getRecentWalletReceipts
};