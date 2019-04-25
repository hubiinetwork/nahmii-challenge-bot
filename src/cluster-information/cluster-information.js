'use strict';

const request = require('superagent');
const config = require('../config');
const NestedError = require('../utils/nested-error');

let _ethereum;

class ClusterInformation {
  static async acquireEthereum () {
    if (!_ethereum) {
      try {
        const clusterInfo = (await request.get(`https://${config.services.baseUrl}`)).body;
        _ethereum = clusterInfo.ethereum;
      }
      catch (err) {
        throw new NestedError(err, 'Failed to retrieve cluster information. ' + err.message);
      }
    }

    return _ethereum;
  }
}

module.exports = ClusterInformation;
