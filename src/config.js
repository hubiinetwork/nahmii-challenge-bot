'use strict';

function validateConfig () {
  function validateEnvVar(envVarName) {
    const env_value = process.env[envVarName];
    if (! env_value)
      throw new Error(`${envVarName} environment variable is not defined.`);
  }

  validateEnvVar('NODE_ENV');
  validateEnvVar('NAHMII_BASE_URL');
  validateEnvVar('CHALLENGE_BOT_UTCADDRESS');
  validateEnvVar('CHALLENGE_BOT_UTCSECRET');
  validateEnvVar('CHALLENGE_BOT_APPID');
  validateEnvVar('CHALLENGE_BOT_APPSECRET');
  validateEnvVar('ETHEREUM_NODE_URL');
  validateEnvVar('ETHEREUM_GAS_LIMIT');

  if (process.env['NAHMII_BASE_URL'].includes('//'))
    throw new Error('NAHMII_BASE_URL environment variable must contain base URL without protocol.');
}

module.exports = {
  validateConfig,
  services: {
    baseUrl: process.env['NAHMII_BASE_URL'] || 'localhost'
  },
  wallet: {
    utcAddress: process.env['CHALLENGE_BOT_UTCADDRESS'] || '0x026e46ff3d3b2c72b07ed9a2ec4d17d5b98c7ce0',
    utcSecret: process.env['CHALLENGE_BOT_UTCSECRET'] || '12345'
  },
  identity: {
    appId: process.env['CHALLENGE_BOT_APPID'] || '',
    appSecret: process.env['CHALLENGE_BOT_APPSECRET'] || ''
  },
  ethereum: {
    nodeUrl: process.env['ETHEREUM_NODE_URL'] || '',
    gasLimit: process.env['ETHEREUM_GAS_LIMIT'] || '2000000'
  }
};
