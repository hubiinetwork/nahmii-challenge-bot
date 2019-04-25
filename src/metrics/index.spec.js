'use strict';

const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

const ethers = require('ethers');
const metrics = require('./index');
const prometheus = require('prom-client');

describe('Challenge bot metrics module', () => {

  function getEthBalance () {
    return prometheus.register.getSingleMetric('challenge_bot_eth_balance').hashMap[''].value;
  }

  function getProgressCount (label) {
    const hashMap = prometheus.register.getSingleMetric('challenge_bot_progress_counter').hashMap;
    const key = 'progress:' + label;

    return hashMap[key].value;
  }

  beforeEach(() => {
    metrics.initProgressCounter();
  });

  afterEach(() => {
    prometheus.register.resetMetrics();
  });

  it('exports an app property', () => {
    expect(metrics.app).to.be.an.instanceof(Object);
  });

  it('starts to capture default metrics', () => {
    expect(prometheus.register._metrics).to.haveOwnProperty('challenge_bot_nodejs_eventloop_lag_seconds');
    expect(Object.getOwnPropertyNames(prometheus.register._metrics).length).to.be.greaterThan(12);
  });


  describe('#registerEthBalanceBN()', () => {
    it('sets a value', () => {
      metrics.registerEthBalanceBN(ethers.utils.parseEther('1'));
      expect(getEthBalance()).to.equal(1);
    });

    it('set a higher value', () => {
      metrics.registerEthBalanceBN(ethers.utils.parseEther('1'));
      metrics.registerEthBalanceBN(ethers.utils.parseEther('3'));
      expect(getEthBalance()).to.eql(3);
    });

    it('set a lower value', () => {
      metrics.registerEthBalanceBN(ethers.utils.parseEther('4'));
      metrics.registerEthBalanceBN(ethers.utils.parseEther('2'));
      expect(getEthBalance()).to.eql(2);
    });
  });

  const functions = [
    'registerDscStarted', 'registerDscAgreed', 'registerDscDisputed',
    'registerNscStarted', 'registerNscAgreed', 'registerNscDisputed', 'registerBalancesSeized'
  ];

  const labels = [
    'dsc_started', 'dsc_agreed', 'dsc_disputed',
    'nsc_started', 'nsc_agreed', 'nsc_disputed', 'balances_seized'
  ];

  for (let i = 0; i < 7; ++i) {
    describe(`#${functions[i]}()`, () => {
      it('starts on zero', () => {
        expect(getProgressCount(labels[i])).to.equal(0);
      });

      it('increases to one', () => {
        metrics[functions[i]]();
        expect(getProgressCount(labels[i])).to.equal(1);
      });

      it('increases to two', () => {
        metrics[functions[i]]();
        metrics[functions[i]]();
        expect(getProgressCount(labels[i])).to.equal(2);
      });
    });
  }
});
