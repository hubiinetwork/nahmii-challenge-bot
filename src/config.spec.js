'use strict';

const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');

const variableNames = [
  'NODE_ENV',
  'NAHMII_BASE_URL',
  'CHALLENGE_BOT_UTCADDRESS',
  'CHALLENGE_BOT_UTCSECRET',
  'CHALLENGE_BOT_APPID',
  'CHALLENGE_BOT_APPSECRET',
  'ETHEREUM_NODE_URL',
  'ETHEREUM_GAS_LIMIT'
];

function backupEnv () {
  const backup = {};

  for (const variableName of variableNames)
    backup[variableName] = process.env[variableName];

  return backup;
}

function restoreEnv (backup) {
  for (const variableName of variableNames) {
    if (backup[variableName])
      process.env[variableName] = backup[variableName];
    else
      delete process.env[variableName];
  }
}

function fakeupEnv () {
  for (const variableName of variableNames)
    process.env[variableName] = variableName;
}

describe ('config', () => {
  let envBackup, config;

  beforeEach (() => {
    envBackup = backupEnv();
    fakeupEnv();
    config = proxyquire('./config', { '': {} });
  });

  afterEach (() => {
    restoreEnv(envBackup);
  });

  describe ('#validateConfig() detects ill-defined variables', () => {
    for (const variableName of variableNames) {
      it (`Throws if ${variableName} is not defined`, function () {
        delete process.env[variableName];
        expect(config.validateConfig).to.throw(new RegExp(`^${variableName}`));
      });
    }

    it ('Throws if \'NAHMII_BASE_URL\' contains protocol info', function () {
      process.env['NAHMII_BASE_URL'] = 'http://localhost';
      expect(config.validateConfig).to.throw(/must contain base URL without protocol/);
    });
  });

  describe ('#validateConfig() accepts defined variables', () => {
    it ('Accepts all variables', function () {
      expect(config.validateConfig).to.not.throw();
    });
  });

});