'use strict';

const sinon = require('sinon');

class FakeBinaryBlockSearcher {
  constructor () {
  }

  static reset () {
    FakeBinaryBlockSearcher.findBlockLte.reset();
  }
}

FakeBinaryBlockSearcher.findBlockLte = sinon.stub();

module.exports = FakeBinaryBlockSearcher;
