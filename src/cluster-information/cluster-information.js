'use strict';

const request = require('superagent');
const config = require('../config');
const NestedError = require('../utils/nested-error');

const _ethereum = new WeakMap();

class ClusterInformation {
  constructor () {
  }

  async acquireEthereum () {
    if (!_ethereum.has(this)) {
      try {
        const clusterInfo = (await request.get(`https://${config.services.baseUrl}`)).body;
        _ethereum.set(this, clusterInfo.ethereum);
      }
      catch (err) {
        throw new NestedError(err, 'Failed to retrieve cluster information. ' + err.message);
      }
    }

    return _ethereum.get(this);
  }
}

module.exports = ClusterInformation;
