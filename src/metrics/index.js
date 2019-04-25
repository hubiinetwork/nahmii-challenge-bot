'use strict';

const app = require('./app');
const prometheus = require('prom-client');
const ethers = require('ethers');

prometheus.collectDefaultMetrics({timeout: 5000, prefix: 'challenge_bot_'});

const ethBalance = new prometheus.Gauge({
  name: 'challenge_bot_eth_balance',
  help: 'ETH owned by bot'
});

const progressCounter = new prometheus.Counter({
  name: 'challenge_bot_progress_counter',
  help: 'Progress stages encountered by bot',
  labelNames: ['progress']
});


const dsc_started = 'dsc_started';
const dsc_agreed = 'dsc_agreed';
const dsc_disputed = 'dsc_disputed';
const nsc_started = 'nsc_started';
const nsc_agreed = 'nsc_agreed';
const nsc_disputed = 'nsc_disputed';
const balances_seized = 'balances_seized';

function initProgressCounter () {
  // Labels do not exist unless initialized
  // See https://github.com/siimon/prom-client/issues/118
  progressCounter.inc({progress: dsc_started}, 0);
  progressCounter.inc({progress: dsc_agreed}, 0);
  progressCounter.inc({progress: dsc_disputed}, 0);
  progressCounter.inc({progress: nsc_started}, 0);
  progressCounter.inc({progress: nsc_agreed}, 0);
  progressCounter.inc({progress: nsc_disputed}, 0);
  progressCounter.inc({progress: balances_seized}, 0);
}

function registerEthBalanceBN(newEthBalanceBN) {
  ethBalance.set(Number(ethers.utils.formatEther(newEthBalanceBN)));
}

function registerDscStarted() {
  progressCounter.inc({progress: dsc_started});
}

function registerDscAgreed() {
  progressCounter.inc({progress: dsc_agreed});
}

function registerDscDisputed() {
  progressCounter.inc({progress: dsc_disputed});
}

function registerNscStarted() {
  progressCounter.inc({progress: nsc_started});
}

function registerNscAgreed() {
  progressCounter.inc({progress: nsc_agreed});
}

function registerNscDisputed() {
  progressCounter.inc({progress: nsc_disputed});
}

function registerBalancesSeized() {
  progressCounter.inc({progress: balances_seized});
}

module.exports = {
  initProgressCounter,
  registerEthBalanceBN,
  registerDscStarted,
  registerDscAgreed,
  registerDscDisputed,
  registerNscStarted,
  registerNscAgreed,
  registerNscDisputed,
  registerBalancesSeized,
  app
};
