'use strict';
/* eslint-disable no-unused-expressions */
/* eslint-disable padded-blocks */

const chai = Object.create(require('chai'));
chai.use(require('chai-as-promised'));
chai.should();
const { given, req } = require('../utils/gwt');

const { acquireSenderWallet } = require('./sender-wallet');

describe('SyncCallValidator behavior in async function', function () {

  given('an instrumented function', () => {
    return '';
  })

    .when('called twice sequentially', given => {
      return '';
    })

    .then('works', () => {
      req('works', (given, resulting) => {
      });
    });
});
