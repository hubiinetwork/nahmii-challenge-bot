'use strict';

const request = require('superagent');
const config = require('../config');
const NestedError = require('../utils/nested-error');

let clusterInfo;
let timeToRefresh = 0;

async function acquireInfo () {
  try {
    if (timeToRefresh < Date.now()) {
      clusterInfo = (await request.get(`https://${config.services.baseUrl}`)).body;
      timeToRefresh = Date.now() + 10000; // 10 sec
    }

    return clusterInfo;
  }
  catch (err) {
    throw new NestedError(err, 'Failed to retrieve cluster information. ' + err.message);
  }
}

class ClusterInformation {

  static async getEthereum () {
    try {
      const { ethereum } = await acquireInfo();
      return ethereum;
    }
    catch (err) {
      throw new NestedError(err, 'Failed to retrieve ethereum info. ' + err.message);
    }
  }
}

module.exports = ClusterInformation;
