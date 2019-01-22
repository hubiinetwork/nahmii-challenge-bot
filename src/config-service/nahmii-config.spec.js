'use strict';
/* eslint-disable no-unused-expressions */
/* eslint-disable padded-blocks */

const chai = Object.create(require('chai'));
chai.use(require('chai-as-promised'));
chai.should();
const { given, req } = require('../utils/gwt');
const yaml = require('node-yaml');
const path = require('path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const fakeConfigPath = path.join(__dirname, 'nahmii-config-fake.yaml');

const pathStub = {
  resolve: sinon.stub()
};

const keythereumStub = {
  importFromFile: sinon.stub(),
  recover: sinon.stub().returns({ toString: () => '' })
};

const nahmiiConfig = proxyquire('./nahmii-config', {
  'path': pathStub,
  'keythereum': keythereumStub
});

const { acquireNahmiiConfig } = nahmiiConfig;
const { dropNahmiiConfig } = nahmiiConfig.backdoor;

function hasExpectedConfigContent () {
  req('apiRoot', (given, resulting) => {
    resulting.cfg.apiRoot.should.equal(given.cfg.apiRoot);
  });
  req('appId', (given, resulting) => {
    resulting.cfg.appId.should.equal(given.cfg.appId);
  });
  req('appSecret', (given, resulting) => {
    resulting.cfg.appSecret.should.equal(given.cfg.appSecret);
  });
  req('wallet address', (given, resulting) => {
    resulting.cfg.wallet.address.should.equal(given.cfg.wallet.address);
  });
  req('wallet secret', (given, resulting) => {
    resulting.cfg.wallet.secret.should.equal(given.cfg.wallet.secret);
  });
}

describe('nahmii-config', function () {

  given('config file exists', () => {
    pathStub.resolve.returns(fakeConfigPath);
    return { cfg: yaml.readSync(fakeConfigPath, { schema: yaml.schema.json }) };
  })

    .when('acquired first time', () => {
      dropNahmiiConfig();
      pathStub.resolve.resetHistory();
      return { cfg: acquireNahmiiConfig() };
    })

    .then('created with expected content', () => {
      req('did access config file', () => {
        pathStub.resolve.called.should.be.true;
      });

      hasExpectedConfigContent.call(this);
    })

    .when('acquired second time', () => {
      pathStub.resolve.resetHistory();
      return { cfg: acquireNahmiiConfig() };
    })

    .then('reused with expected content', () => {
      req('did not access config file', () => {
        pathStub.resolve.called.should.be.false;
      });

      hasExpectedConfigContent.call(this);
    });

  given('config file does not exists', () => {
    pathStub.resolve.returns('/some/nonexistent/file/path.yaml');
    return {};
  })

    .when('acquired', given => {
      dropNahmiiConfig();
      pathStub.resolve.resetHistory();
      try {
        return { cfg: acquireNahmiiConfig() };
      }
      catch (err) {
        return { err: err };
      }
    })

    .then('throws', () => {
      req('throws', (_, resulting) => {
        resulting.err.should.be.instanceof(Error);
      });
    });

  given('config file is corrupted', () => {
    pathStub.resolve.returns(path.join(__dirname, 'nahmii-config-corrupt.yaml'));
    return {};
  })

    .when('acquired', given => {
      dropNahmiiConfig();
      pathStub.resolve.resetHistory();
      try {
        return { cfg: acquireNahmiiConfig() };
      }
      catch (err) {
        return { err: err };
      }
    })

    .then('throws', () => {
      req('throws', (_, resulting) => {
        resulting.err.should.be.instanceof(Error);
      });
    });
});
