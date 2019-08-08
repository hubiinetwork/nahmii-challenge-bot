'use strict';

const EventEmitter = require('events');

const sinon = require('sinon');

class FakeNahmiiProvider {
  constructor () {
    this.eventEmitter = new EventEmitter();
    this.reset();
  }

  reset () {
    this.getBlockNumber = sinon.stub().returns(0);
    this.getLogs = sinon.stub().throws(new Error('getLogs() stub is not initialized.'));
    this.getBlock = sinon.stub().throws(new Error('getBlock() stub is not initialized.'));
    this.eventEmitter.removeAllListeners();
  }

  async once (eventName, eventListener) {
    this.eventEmitter.once(eventName, eventListener);
  }
}

module.exports = FakeNahmiiProvider;
