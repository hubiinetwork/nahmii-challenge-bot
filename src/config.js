'use strict';

function devDefault (str) {
  return process.env['NODE_ENV'] === 'production' ? undefined : str;
}

class Config {
  static isValid () {
    return true &&
      !!Config.services.baseUrl &&
      !!Config.wallet.utcAddress &&
      !!Config.wallet.utcSecret &&
      !!Config.identity.appId &&
      !!Config.identity.appSecret &&
      !!Config.ethereum.nodeUrl &&
      !!Config.ethereum.gasLimit;
  }

  static get services () {
    return {
      baseUrl: process.env['NAHMII_BASE_URL'] || devDefault('api2.dev.hubii.net')
    };
  }

  static get wallet () {
    return {
      utcAddress: process.env['CHALLENGE_BOT_UTCADDRESS'] || devDefault('0x026e46ff3d3b2c72b07ed9a2ec4d17d5b98c7ce0'),
      utcSecret: process.env['CHALLENGE_BOT_UTCSECRET'] || devDefault('12345')
    };
  }

  static get identity () {
    return {
      appId: process.env['CHALLENGE_BOT_APPID'],
      appSecret: process.env['CHALLENGE_BOT_APPSECRET']
    };
  }

  static get ethereum () {
    return {
      nodeUrl: process.env['ETHEREUM_NODE_URL'] || devDefault('https://ropsten.infura.io'),
      gasLimit: process.env['ETHEREUM_GAS_LIMIT'] || '2000000'
    };
  }
}

module.exports = Config;
