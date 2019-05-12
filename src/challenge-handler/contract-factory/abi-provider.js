'use strict';

function getAbiPath (contractName, network) {

  if (network !== 'ropsten' && network !== 'homestead')
    throw new Error (`Failed to recognize network name '${network}'`);

  const packageMap = {
    ropsten: 'nahmii-contract-abstractions-ropsten',
    homestead: 'nahmii-contract-abstractions'
  };

  return `${packageMap[network]}/build/contracts/${contractName}.json`;
}

function getAbiInfo (contractName, network) {
  return require(getAbiPath(contractName, network));
}

module.exports = {
  getAbiPath,
  getAbiInfo
};
