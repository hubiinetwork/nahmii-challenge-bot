'use strict';

const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));
const { NahmiiProvider } = require('nahmii-sdk');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const nock = require('nock');

const metaServiceNocker = require('../cluster-information/meta-service-nocker');
const given = describe;
const when = describe;

describe('nahmii-provider-factory', () => {
  given('a NahmiiProviderFactory', () => {
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

    when('invoked to acquire a NahmiiProvider', () => {

      it ('creates provider if it is acquired for the first time', async () => {
        metaServiceNocker.resolveWithData();
        const provider = await nahmiiProviderFactory.acquireProvider();
        expect(provider).to.not.be.undefined;
        expect(provider).to.be.instanceOf(NahmiiProvider);
      });

      it ('returns a cached NahmiiProvider on successive calls', async () => {
        metaServiceNocker.resolveWithData();
        const provider1 = await nahmiiProviderFactory.acquireProvider();
        const provider2 = await nahmiiProviderFactory.acquireProvider();
        expect(provider2).to.not.be.undefined;
        expect(provider2).to.be.instanceOf(NahmiiProvider);
        expect(provider1 === provider2).to.be.true;
      });

      it ('fails to acquire a NahmiiProvider on cluster failure', () => {
        const provider = nahmiiProviderFactory.acquireProvider();
        return expect(provider).to.eventually.rejectedWith(/Failed/);
      });
    });
  });
});
