'use strict';

const config = require('../config');
const nahmii = require('nahmii-sdk');

let nahmiiProvider;

function acquireNahmiiProvider () {
  if (!nahmiiProvider)
    nahmiiProvider = nahmii.NahmiiProvider.from(config.services.baseUrl, config.identity.appId, config.identity.appSecret);

  return nahmiiProvider;
}

module.exports = {
  acquireNahmiiProvider
};
