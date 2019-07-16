'use strict';

const { execSync } = require('child_process');
const request = require('superagent');
const nahmii = require('nahmii-sdk');

function throwIfMinikubeIsNotRunning () {
  const line = execSync('minikube status | grep host').toString().split('\n')[0];
  const status = line.split(' ')[1];
  if (status !== 'Running')
    throw new Error('Testing failed. minikube is not running.');
}

let _ip;

class Minikube {
  static get ip () {
    if (!_ip) {
      throwIfMinikubeIsNotRunning();
      _ip = execSync('minikube ip').toString().split('\n')[0];
    }
    return _ip;
  }

  static get appId () {
    return '5c6e506991f223001065179c';
  }

  static get appSecret () {
    return '$2a$10$YmyvoQx9nWJupw5tuU4KY.rioq6jZvntc/YP7s.ElxMghf./2050y';
  }

  static get accounts () {
    // Must be configured in mini-cluster
    return {
      owner: { address: '0x3135613dd7a8e109fe530788a6fbd006e8590988', privateKey: '0x29d32d06b0e97709a33c8108ac9da28aa7a8239a7cf3b7a4d12b2050af9209f5' },
      faucet: { address: '0x3135613dd7a8e109fe530788a6fbd006e8590988', privateKey: '0x29d32d06b0e97709a33c8108ac9da28aa7a8239a7cf3b7a4d12b2050af9209f5' },
      miner:  { address: '0xbcda4cbbeec5927235f6191ac9322f1514616e96', privateKey: '0x9ef705cd31370112cbc3d0c88d401f2397f3fe1e530306e5a572d57a196199d6' }
    };
  }

  static get baseUrl () {
    return this.ip ;
  }

  static get nodeUrl () {
    return 'https://' + this.ip + '/ganache-cli:8545';
  }

  static get network () {
    return 'ropsten';
  }

  static async getCurrency (symbol) {
    const currencies = [
      {
        symbol: 'ETH',
        ct: '0x0000000000000000000000000000000000000000',
        id: 0,
        unit: 18
      },
      {
        symbol: 'T18',
        ct: require('./T18.json').networks[3].address,
        id: 0,
        unit: 18
      },
      {
        symbol: 'T15',
        ct: require('./T15.json').networks[3].address,
        id: 0,
        unit: 15
      }
    ];

    const currency = currencies.find(currency => currency.symbol === symbol);

    if (!currency)
      throw new Error(`Currency with symbol '${symbol}' not found`);

    return currency;
  }
}

module.exports = Minikube;
