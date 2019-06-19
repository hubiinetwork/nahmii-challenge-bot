'use strict';

const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

const variableNames = [
  'NAHMII_BASE_URL',
  'CHALLENGE_BOT_UTCADDRESS',
  'CHALLENGE_BOT_UTCSECRET',
  'CHALLENGE_BOT_APPID',
  'CHALLENGE_BOT_APPSECRET',
  'ETHEREUM_NODE_URL'
];

describe ('Config', () => {
  let backupEnv;

  beforeEach (() => {
    backupEnv = Object.assign({}, process.env);
  });

  afterEach (() => {
    process.env = backupEnv;
  });

  describe ('given the Config instance', () => {
    let Config;

    beforeEach(() => {
      variableNames.forEach(name => delete process.env[name]);
      Config = proxyquire('./config', {});
    });

    describe ('when called serving only default values in development environment', () => {
      beforeEach(() => {
        delete process.env['NODE_ENV'];
      });

      [
        'services.baseUrl',
        'services.metricsPort',
        'wallet.utcAddress',
        'wallet.utcSecret',
        'ethereum.nodeUrl',
        'ethereum.gasLimit'
      ].forEach(prop => {
        it(`has default value for #${prop}`, () => {
          const keys = prop.split('.');
          expect(Config[keys[0]][keys[1]]).not.to.be.undefined;
        });
      });

      [
        'identity.appId',
        'identity.appSecret'
      ].forEach(prop => {
        it(`does not have default value for #${prop}`, () => {
          const keys = prop.split('.');
          expect(Config[keys[0]][keys[1]]).to.be.undefined;
        });
      });
    });

    describe ('called serving only default values in production environment', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
      });

      [
        'services.metricsPort',
        'ethereum.gasLimit'
      ].forEach(prop => {
        it(`has default value for #${prop}`, () => {
          const keys = prop.split('.');
          expect(Config[keys[0]][keys[1]]).not.to.be.undefined;
        });
      });

      [
        'services.baseUrl',
        'wallet.utcAddress',
        'wallet.utcSecret',
        'identity.appId',
        'identity.appSecret',
        'ethereum.nodeUrl'
      ].forEach(prop => {
        it(`does not have default value for #${prop}`, () => {
          const keys = prop.split('.');
          expect(Config[keys[0]][keys[1]]).to.be.undefined;
        });
      });
    });

    describe ('when it is validated', () => {
      beforeEach(() => {
        variableNames.forEach(name => process.env[name] = 'dummy');
        process.env['NODE_ENV'] = 'production';
      });

      it ('succeeds if all properties are defined', () => {
        Config = proxyquire('./config', {});
        expect(Config.isValid()).to.be.true;
      });

      variableNames.forEach(name => {
        it (`fails if property corresponding to ${name} is undefined`, () => {
          delete process.env[name];
          Config = proxyquire('./config', {});
          expect(Config.isValid()).to.be.false;
        });
      });
    });

    describe ('when status string is requested', () => {
      beforeEach(() => {
        variableNames.forEach(name => process.env[name] = 'dummy');
        process.env['NODE_ENV'] = 'production';
      });

      it ('status string reflects all properties are defined', () => {
        expect(Config.getValidationStr()).to.be.equal('OK');
      });

      variableNames.forEach(name => {
        it (`status string reflects undefined ${name}`, () => {
          delete process.env[name];
          Config = proxyquire('./config', {});
          expect(Config.getValidationStr()).to.match(/is undefined/);
        });
      });
    });
  });
});