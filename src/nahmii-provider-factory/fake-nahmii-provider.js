'use strict';

const sinon = require('sinon');

class FakeNahmiiProvider {
  constructor () {
    this.reset();
  }

  reset () {
    this.onceStub = sinon.stub().returns(0);
    this.getBlockNumber = sinon.stub().returns(0);
    this.getLogs = sinon.stub().throws(new Error('getLogs() stub is not initialized.'));
  }

  async once (tag, cb) {
    await new Promise(resolve => setTimeout(resolve, 100)); // Avoid hogging CPU
    return this.onceStub(tag, cb);
  }

  setBlockNumber (blockNo) {
    this.onceStub.callsArgWith(1, blockNo);
    this.getBlockNumber.returns(blockNo);
  }
}

module.exports = FakeNahmiiProvider;
