'use strict';

const nock = require('nock');

const config = require('../config');

function resolveWithData (count=1) {
  for (let i = 0; i < count; ++i) {
    nock(`https://${config.services.baseUrl}`)
      .get('/')
      .reply(200, require('./cluster-information.spec.data.json') );
  }
}

module.exports = {
  resolveWithData
};