'use strict';

const EventEmitter = require('events');
const sinon = require('sinon');

class FakeNahmiiProvider {
  constructor () {
    this.eventEmitter = new EventEmitter();
    this.reset();
  }

  reset () {
    this.eventEmitter.removeAllListeners();
    this.eventEmitter = new EventEmitter();
    this.onceStub = sinon.stub().returns(0);
    this.getBlockNumber = sinon.stub().returns(0);
    this.getLogs = sinon.stub().throws(new Error('getLogs() stub is not initialized.'));
  }

  async once (eventName, listener) {
    return this.eventEmitter.once(eventName, listener);
  }

  setBlockNumber (blockNo) {
    this.onceStub.callsArgWith(1, blockNo);
    this.getBlockNumber.returns(blockNo);
  }
}

module.exports = FakeNahmiiProvider;
