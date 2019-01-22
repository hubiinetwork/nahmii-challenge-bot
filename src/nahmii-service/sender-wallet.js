'use strict';

const { acquireNahmiiConfig } = require('../config-service/nahmii-config');
const { acquireNahmiiProvider } = require('./nahmii-provider');
const nahmii = require('nahmii-sdk');

let senderWallet;

async function acquireSenderWallet () {
  if (!senderWallet) {
    const config = acquireNahmiiConfig();
    const nahmiiProvider = await acquireNahmiiProvider();
    senderWallet = new nahmii.Wallet(config.privateKey, nahmiiProvider);
  }
  return senderWallet;
}

module.exports = {
  acquireSenderWallet
};
