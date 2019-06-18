'use strict';

function devDefault (str) {
  return process.env['NODE_ENV'] === 'production' ? undefined : str;
}

class Config {
  static getStateMap () {
    return [
      [ Config.services.baseUrl, 'Config.services.baseUrl is undefined' ],
      [ Config.wallet.utcAddress, 'Config.wallet.utcAddress is undefined' ],
      [ Config.wallet.utcSecret, 'Config.wallet.utcSecret is undefined' ],
      [ Config.identity.appId, 'Config.identity.appId is undefined' ],
      [ Config.identity.appSecret, 'Config.identity.appSecret is undefined' ],
      [ Config.ethereum.nodeUrl, 'Config.ethereum.nodeUrl is undefined' ]
    ];
  }

  static isValid () {
    return Config.getStateMap().every(item => item[0]);
  }

  static getValidationStr () {
    const item = Config.getStateMap().find(item => !item[0]);
    return item ? item[1] : 'OK';
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
