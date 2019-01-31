'use strict';
/* eslint-disable no-unused-expressions */
/* eslint-disable padded-blocks */

const chai = Object.create(require('chai'));
chai.use(require('chai-as-promised'));
chai.should();
chai.use(require('chai-as-promised'));
const { given, req } = require('../utils/gwt');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const nahmiiConfigStub = {
  acquireNahmiiConfig: sinon.stub().returns({})
};

class NahmiiProvider {
  static from () {
    return Promise.resolve(new NahmiiProvider());
  }
}

const { acquireNahmiiProvider } = proxyquire('./nahmii-provider', {
  '../config-service/nahmii-config': nahmiiConfigStub,
  'nahmii-sdk': { NahmiiProvider }
});

describe('nahmii-provider', function () {

  given('not previously accessed', () => {
    return '';
  })

    .when('accessed', given => {
      return { provider: acquireNahmiiProvider() };
    })

    .then('created and returned', () => {
      req('reference found', async (given, resulting) => {
        return resulting.provider.should.eventually.be.instanceof(NahmiiProvider);
      });
    });

  given('previously accessed', () => {
    return '';
  })

    .when('accessed', given => {
      return { provider: acquireNahmiiProvider() };
    })

    .then('old reference returned', () => {
      req('reference found', async (given, resulting) => {
        return resulting.provider.should.eventually.be.instanceof(NahmiiProvider);
      });
    });
});
