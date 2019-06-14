'use strict';

const config = require('../config');
const NestedError = require('../utils/nested-error');
const ClusterInformation = require('../cluster-information');
const nahmii = require('nahmii-sdk');

let _nahmiiProvider;

class NahmiiProviderFactory {
  static async acquireProvider () {
    if (!_nahmiiProvider) {
      try {
        const ethereum = await ClusterInformation.acquireEthereum();

        _nahmiiProvider = new nahmii.NahmiiProvider(
          config.services.baseUrl,
          config.identity.appId, config.identity.appSecret,
          config.ethereum.nodeUrl, ethereum.net
        );
      }
      catch (err) {
        throw new NestedError(err, 'Failed to acquire NahmiiProvider. ' + err.message);
      }
    }

    return _nahmiiProvider;
  }
}

module.exports = NahmiiProviderFactory;
