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

// See mini-cluster ganache-cli deployment spec for special accounts
const accounts = [
  { address: '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1', privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d' },
  { address: '0xffcf8fdee72ac11b5c542428b35eef5769c409f0', privateKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1' },
  { address: '0x22d491bde2303f2f43325b2108d26f1eaba1e32b', privateKey: '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c' },
  { address: '0xe11ba2b4d45eaed5996cd0823791e0c93114882d', privateKey: '0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913' },
  { address: '0xd03ea8624c8c5987235048901fb614fdca89b117', privateKey: '0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743' },
  { address: '0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc', privateKey: '0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd' },
  { address: '0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9', privateKey: '0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52' },
  { address: '0x28a8746e75304c0780e011bed21c72cd78cd535e', privateKey: '0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3' },
  { address: '0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e', privateKey: '0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4' },
  { address: '0x1df62f291b2e969fb0849d99d9ce41e2f137006e', privateKey: '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773' }
];

const global = {
  accounts
};

class Minikube {
  static get ip () {
    if (! global.ip) {
      throwIfMinikubeIsNotRunning();
      global.ip = execSync('minikube ip').toString().split('\n')[0];
    }
    return global.ip;
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
    if (! global.currencies) {
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
      const provider = await new nahmii.NahmiiProvider(Minikube.baseUrl, Minikube.appId, Minikube.appSecret, Minikube.nodeUrl, 'ropsten');
      const accessToken = await provider.getApiAccessToken();

      const response = await request
        .get(`http://${Minikube.baseUrl}/ethereum/supported-tokens`)
        .set('Content-Type', 'application/json')
        .set('authorization', `Bearer ${accessToken}`);

      global.currencies = response.body;
    }

    const currency = global.currencies.find(currency => currency.symbol === symbol);

    if (! currency)
      throw new Error(`Currency with symbol '${symbol}' not found`);

    return {
      ct: currency.currency,
      id: 0
    };
  }
}

module.exports = Minikube;