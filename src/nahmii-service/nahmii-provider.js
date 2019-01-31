'use strict';

const { acquireNahmiiConfig } = require('../config-service/nahmii-config');
const nahmii = require('nahmii-sdk');

let nahmiiProvider;

function acquireNahmiiProvider () {
  if (!nahmiiProvider) {
    const config = acquireNahmiiConfig();
    nahmiiProvider = nahmii.NahmiiProvider.from(config.apiRoot, config.appId, config.appSecret);
  }
  return nahmiiProvider;
}

module.exports = {
  acquireNahmiiProvider
};
