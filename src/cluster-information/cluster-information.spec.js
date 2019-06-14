'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const nock = require('nock');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

const metaServiceNocker = require('./meta-service-nocker');

describe('cluster-information', () => {
  let cluster;

  beforeEach (() => {
    nock.disableNetConnect();
    cluster = proxyquire('./cluster-information', {
      '../config': require('../config')
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
  });

  describe('Can retrieve ethereum info', () => {
    it('Returns info when network request works', function () {
      metaServiceNocker.resolveWithData();
      return expect(cluster.acquireEthereum()).to.eventually.be.fulfilled.with.keys(['contracts', 'net', 'node']);
    });

    it('Fails when network request fails', function () {
      return expect(cluster.acquireEthereum()).to.eventually.be.rejectedWith(/Failed to retrieve cluster information/);
    });

    it('Returns cached info when available', async function () {
      metaServiceNocker.resolveWithData();
      await cluster.acquireEthereum(); // Makes a cache
      return expect(cluster.acquireEthereum()).to.eventually.be.fulfilled.with.keys(['contracts', 'net', 'node']);
    });
  });
});
