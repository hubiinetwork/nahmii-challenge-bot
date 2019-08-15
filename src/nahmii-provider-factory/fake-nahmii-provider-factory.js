'use strict';

const FakeNahmiiProvider = require('./fake-nahmii-provider');

let _fakeNahmiiProvider;

class FakeNahmiiProviderFactory {
  static async acquireProvider () {
    if (!_fakeNahmiiProvider)
      _fakeNahmiiProvider = new FakeNahmiiProvider();

    return _fakeNahmiiProvider;
  }

  static reset () {
    _fakeNahmiiProvider = undefined;
  }
}

module.exports = FakeNahmiiProviderFactory;
