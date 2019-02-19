'use strict';

const config = require('../config');
const nahmii = require('nahmii-sdk');
const prefix0x = nahmii.utils.prefix0x;

const addressRegex = /^0x[0-9a-f]{40}$/i;

function throwIfNotValid (currency, symbol) {
  if (!currency)
    throw new Error(`${symbol}: Currency '${symbol}' is not defined.`);

  if (!currency.currency)
    throw new Error(`${symbol}: 'currency.currency' is not defined.`);

  if (!addressRegex.test(currency.currency))
    throw new Error(`${symbol}: 'currency.currency' has unexpected format. Found '${currency.currency}'.`);

  if (!currency.decimals)
    throw new Error(`${symbol}: 'currency.decimals' is not defined.`);

  if ((currency.decimals !== 18) && (currency.decimals !== 15))
    throw new Error(`${symbol}: 'currency.decimals' has unexpected value. Found '${currency.decimals}'`);

  if (!currency.symbol)
    throw new Error(`${symbol}: 'currency.symbol' is not defined.`);

  if (currency.symbol !== symbol)
    throw new Error(`${symbol}: 'currency.symbol' has unexpected value. Found '${currency.symbol}'`);
}

let currencies;

async function acquireCurrencies () {
  if (!currencies) {
    const provider = nahmii.NahmiiProvider.from(config.services.baseUrl, config.identity.appId, config.identity.appSecret);

    currencies = {};

    currencies.eth = {
      currency: prefix0x('00'.repeat(20)),
      decimals: 18,
      symbol: 'ETH'
    };

    const tokens = await provider.getSupportedTokens();

    currencies.hbt = tokens.find(t => t.symbol.toUpperCase() === 'HBT');
    currencies.nii = tokens.find(t => t.symbol.toUpperCase() === 'NII');

    throwIfNotValid(currencies.eth, 'ETH');
    throwIfNotValid(currencies.hbt, 'HBT');
    throwIfNotValid(currencies.nii, 'NII');
  }

  return currencies;
}

module.exports = {
  acquireCurrencies
};
