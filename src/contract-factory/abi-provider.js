'use strict';

const { execSync } = require('child_process');


function getAbiPath (contractName, network) {

  if (network !== 'ropsten' && network !== 'homestead')
    throw new Error (`Failed to recognize network name '${network}'`);

  const packageName = {
    ropsten: 'nahmii-contract-abstractions-ropsten',
    homestead: 'nahmii-contract-abstractions'
  }[network];

  const abiPaths = execSync(
    `find ./node_modules/${packageName}/build/contracts -type f -name ${contractName}.json`,
    { encoding: 'utf8' }
  ).split('\n');

  abiPaths.pop();

  if (abiPaths.length === 0)
    throw new Error(`Failed to find ABI for contract '${contractName}'`);

  return abiPaths[0];
}

module.exports = {
  getAbiPath
};
