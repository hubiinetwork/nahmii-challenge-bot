'use strict';

function validateConfig () {
  function validateEnvVar(envVarName) {
    if (! process.env[envVarName])
      throw new Error(`${envVarName} environment variable is not defined.`);
  }

  validateEnvVar('NODE_ENV');
  validateEnvVar('NAHMII_BASE_URL');
  validateEnvVar('ETHEREUM_NODE_URL');
  validateEnvVar('CHALLENGE_BOT_PRIVATE_KEY');
  validateEnvVar('CHALLENGE_BOT_APPID');
  validateEnvVar('CHALLENGE_BOT_APPSECRET');

  if (process.env['NAHMII_BASE_URL'].includes('//'))
    throw new Error('NAHMII_BASE_URL environment variable must contain base URL without protocol.');
}

module.exports = {
  validateConfig,
  verbose: true,
  services: {
    baseUrl: process.env['NAHMII_BASE_URL'] || ''
  },
  wallet: {
    privateKey: process.env['CHALLENGE_BOT_PRIVATE_KEY'] || ''
  },
  identity: {
    appId: process.env['CHALLENGE_BOT_APPID'] || '',
    appSecret: process.env['CHALLENGE_BOT_APPSECRET'] || ''
  },
  ethereum: {
    nodeUrl: process.env['ETHEREUM_NODE_URL'] || ''
  }
};
