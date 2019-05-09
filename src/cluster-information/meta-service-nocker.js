'use strict';

const nock = require('nock');

const config = require('../config');

function resolveWithData () {
  const scope = nock(`https://${config.services.baseUrl}`)
    .get('/')
    .reply(200, require('./cluster-information.spec.data.json') );

  return scope;
}

module.exports = {
  resolveWithData
};