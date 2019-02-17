'use strict';

function throwIfNotEnvVar(envVarName) {
  if (! process.env[envVarName])
    throw new Error(`${envVarName} is not defined.`);
}

throwIfNotEnvVar('NODE_ENV');
throwIfNotEnvVar('NAHMII_API_CLUSTER');
throwIfNotEnvVar('CHALLENGER_WALLET_ADDRESS');
throwIfNotEnvVar('CHALLENGER_WALLET_PRIVATE_KEY');
throwIfNotEnvVar('IDENTITY_SERVER_APPID');
throwIfNotEnvVar('IDENTITY_SERVER_SECRET');

if (process.env['NAHMII_API_CLUSTER'].includes('//'))
  throw new Error('NAHMII_API_CLUSTER environment variable must contain base URL without protocol.');

module.exports = {
  verbose: true,
  services: {
    baseUrl: process.env['NAHMII_API_CLUSTER'] || ''
  },
  private_key: {
    address: process.env['CHALLENGER_WALLET_ADDRESS'] || '',
    secret: process.env['CHALLENGER_WALLET_PRIVATE_KEY'] || ''
  },
  identity: {
    appId: process.env['IDENTITY_SERVER_APPID'] || '',
    appSecret: process.env['IDENTITY_SERVER_SECRET'] || ''
  }
};
