'use strict';
/* eslint-disable no-unused-expressions */
/* eslint-disable padded-blocks */

const chai = Object.create(require('chai'));
chai.should();
const { given, req } = require('../utils/gwt');

describe('config', function () {

  given('no precondition', () => {
    return '';
  })

    .when('accessing content', () => {
      return { config: require('./config') };
    })

    .then('expected content', () => {
      req('verbose', (_, resulting) => {
        resulting.config.verbose.should.not.be.undefined;
      });
    });
});
