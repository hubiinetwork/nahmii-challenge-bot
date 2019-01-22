'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('node-yaml');
const keythereum = require('keythereum');
const homedir = require('os').homedir();
const { prefix0x } = require('nahmii-sdk').utils;

function getConfigPath () {
  const configPath = path.resolve(homedir, '.nahmii/config.yaml');

  if (!fs.existsSync(configPath))
    throw new Error('Unable to locate config file: ' + configPath);

  return configPath;
}

function readConfigFile () {
  const configPath = getConfigPath();

  const stats = fs.statSync(configPath);
  if ((stats.mode & 0o77) !== 0)
    console.error('WARNING: Config file is not secure. It is readable others than only the owner!');

  return yaml.readSync(configPath, { schema: yaml.schema.json });
}

function getPrivateKey (cfg) {
  const keyObject = keythereum.importFromFile(cfg.wallet.address, path.resolve(homedir, '.nahmii'));
  const privateKey = prefix0x(keythereum.recover(cfg.wallet.secret, keyObject).toString('hex'));
  return privateKey;
}

let config;

function acquireNahmiiConfig () {
  if (!config) {
    const cfg = readConfigFile();

    config = Object.assign({}, cfg, {
      privateKey: getPrivateKey(cfg),
      sender: prefix0x(cfg.wallet.address)
    });
  }

  return config;
}

function dropNahmiiConfig () {
  config = null;
}

module.exports = {
  acquireNahmiiConfig,
  backdoor: {
    dropNahmiiConfig
  }
};
