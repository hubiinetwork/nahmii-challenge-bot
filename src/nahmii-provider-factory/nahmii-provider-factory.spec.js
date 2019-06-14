'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const { NahmiiProvider } = require('nahmii-sdk');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const nock = require('nock');

const metaServiceNocker = require('../cluster-information/meta-service-nocker');

describe('nahmii-provider-factory', () => {
  describe('can create a nahmii provider', () => {
    let nahmiiProviderFactory;

    beforeEach(() => {
      nock.disableNetConnect();
      nahmiiProviderFactory = proxyquire('./nahmii-provider-factory', {
        '../cluster-information': proxyquire('../cluster-information/cluster-information', {
          '../config': require('../config')
        })
      });
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    it ('creates provider', () => {
      console.log('nahmii-provider-factory.spec.js: ' + JSON.stringify(require('../config')));
      metaServiceNocker.resolveWithData();
      const provider = nahmiiProviderFactory.acquireProvider();
      return expect(provider).to.eventually.be.instanceOf(NahmiiProvider);
    });

    it ('fails to create on cluster failure', () => {
      const provider = nahmiiProviderFactory.acquireProvider();
      return expect(provider).to.eventually.rejectedWith(/Failed/);
    });
  });
});