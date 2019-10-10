'use strict';

const t = require('../../runtime-types');
const NestedError = require('../../utils/nested-error');
const { BigNumber } = require('ethers').utils;

function getParty (wallet, receipt) {
  t.EthereumAddress().assert(wallet);

  if (wallet.isEqual(receipt.sender.wallet))
    return receipt.sender;
  if (wallet.isEqual(receipt.recipient.wallet))
    return receipt.recipient;

  throw new Error('Unexpected wallet. Wallet not party of receipt.');
}

async function getWalletReceipts(provider, wallet) {
  t.EthereumAddress().assert(wallet);

  try {
    return (await provider.getWalletReceipts(wallet.toString(), null, 100))
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
  t.EthereumAddress().assert(wallet);
  t.EthersBigNumber().assert(nonce);

  const receipts = await getWalletReceipts(provider, wallet);

  const filtered = receipts.filter(receipt => nonce.eq(receipt.party.nonce));

  if (filtered.length !== 1)
    throw new Error(`Expected exactly one receipt for address ${wallet} to match nonce ${nonce}`);

  return filtered[0];
}

async function getRecentWalletReceipts(provider, wallet, ct, id, minSenderNonce, minBlockNo) {
  t.EthereumAddress().assert(wallet);
  t.EthereumAddress().assert(ct);
  t.EthersBigNumber().assert(id);
  t.EthersBigNumber().assert(minSenderNonce);
  t.uint().assert(minBlockNo);

  const receipts = await getWalletReceipts(provider, wallet);

  const filtered = receipts.filter(receipt => {
    return ct.isEqual(receipt.currency.ct) && id.eq(receipt.currency.id) &&
    minSenderNonce.lte(receipt.party.nonce) && (Number.parseInt(receipt.blockNumber) >= minBlockNo);
  });

  return filtered;
}

module.exports = {
  getWalletReceipts,
  getWalletReceiptFromNonce,
  getRecentWalletReceipts
};