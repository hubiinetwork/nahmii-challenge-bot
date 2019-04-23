'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const superAgentMock = {
  get: sinon.stub()
};

const cluster = proxyquire('./cluster-information', {
  'superagent': superAgentMock
});

describe('cluster-information', () => {
  beforeEach (() => {
    superAgentMock.get.reset();
  });

  describe('Can retrieve ethereum info', () => {
    // Failure must be tested first since call initializes
    it('Fails when network request fails', async function () {
      superAgentMock.get.throws(new Error('Request failed'));
      return expect(cluster.getEthereum()).to.eventually.be.rejectedWith(/Failed to retrieve cluster information/);
    });

    it('Returns info when network request works', async function () {
      superAgentMock.get.returns(Promise.resolve({ body: require('./cluster-information.spec.data.json') }));
      return expect(cluster.getEthereum()).to.eventually.be.fulfilled.with.keys(['contracts', 'net', 'node']);
    });

    it('Returns cached info when available', async function () {
      superAgentMock.get.throws(new Error('Request failed')); // Throws if not cached network
      return expect(cluster.getEthereum()).to.eventually.be.fulfilled.with.keys(['contracts', 'net', 'node']);
    });
  });
});
