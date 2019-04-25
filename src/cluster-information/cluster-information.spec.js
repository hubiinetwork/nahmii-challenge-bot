'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('cluster-information', () => {
  let superAgentMock, cluster;

  beforeEach (() => {
    superAgentMock = {
      get: sinon.stub()
    };
    superAgentMock.get.resolves({ body: require('./cluster-information.spec.data.json') });

    cluster = proxyquire('./cluster-information', {
      'superagent': superAgentMock
    });
  });

  describe('Can retrieve ethereum info', () => {
    it('Returns info when network request works', function () {
      return expect(cluster.acquireEthereum()).to.eventually.be.fulfilled.with.keys(['contracts', 'net', 'node']);
    });

    it('Fails when network request fails', function () {
      superAgentMock.get.rejects(new Error('Request failed'));
      return expect(cluster.acquireEthereum()).to.eventually.be.rejectedWith(/Failed to retrieve cluster information/);
    });

    it('Returns cached info when available', async function () {
      await cluster.acquireEthereum(); // Makes a cache
      superAgentMock.get.rejects(new Error('Request failed')); // Throws if network accessed
      return expect(cluster.acquireEthereum()).to.eventually.be.fulfilled.with.keys(['contracts', 'net', 'node']);
    });
  });
});
