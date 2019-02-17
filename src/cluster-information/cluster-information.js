'use strict';

const request = require('superagent');
const config = require('../config');

let clusterInfo;
let timeToRefresh = 0;

class ClusterInformation {

  static async aquireInfo() {
    if (timeToRefresh < Date.now()) {
      clusterInfo = await request.get(`https://${config.services.baseUrl}`)
        .then(res => res.body)
        .catch(err => {
          throw new Error('Unable to retrieve cluster information: ' + err);
        });

      timeToRefresh = Date.now() + 10000; // 10 sec
    }

    return clusterInfo;
  }

  static async aquireEthereumUrl () {
    const { ethereum } = await ClusterInformation.aquireInfo();
    return ethereum.node;
  }

  static async aquireContractAddress (contractName) {
    const { ethereum } = await ClusterInformation.aquireInfo();
    return ethereum.contracts[contractName];
  }
}

module.exports = ClusterInformation;
