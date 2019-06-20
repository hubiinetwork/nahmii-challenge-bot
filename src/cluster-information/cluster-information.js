'use strict';

const request = require('superagent');
const config = require('../config');
const NestedError = require('../utils/nested-error');
const { logger } = require('@hubiinetwork/logger');

let _ethereum;

class ClusterInformation {
  static async acquireEthereum () {
    if (!_ethereum) {
      try {
        const url = `https://${config.services.baseUrl}`;
        logger.info(`ClusterInformation: ${url}`);

        const clusterInfo = (await request.get(url)).body;
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
