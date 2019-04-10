'use strict';

const ethers = require('ethers');
const ClusterInformation = require('../cluster-information');
const { execSync } = require('child_process');

function getAbiPath (contractName, network) {
  return new Promise((resolve, reject) =>{
    const abiPaths = execSync(
      `find ./node_modules/nahmii-contract-abstractions-${network}/build/contracts -type f -name ${contractName}.json`,
      { encoding: 'utf8' }
    ).split('\n');

    if (abiPaths.length < 1)
      reject(new Error('Could not find ABI of contract: ' + contractName));
    else
      resolve(abiPaths[0]);
  });
}

class ContractFactory {
  static async create (contractName, provider) {
    const ethereum = await ClusterInformation.getEthereum();
    const contractAddress = ethereum.contracts[contractName];
    const abiPath = await getAbiPath(contractName, ethereum.net);
    const deployment = require('../../' + abiPath);

    if (!deployment.networks)
      throw new Error(`Failed to find abi for contract: ${contractName}`);

    if (deployment.networks[provider.network.chainId].address !== contractAddress) {
      const msg = 'Contract addresses do not match.\n' +
      `        ${contractName}\n` +
      `        meta service : ${contractAddress}\n` +
      `        abi address  : ${deployment.networks[provider.network.chainId].address}`;

      if (process.env.NODE_ENV === 'production')
        throw new Error(msg);
      else
        console.log(msg);
    }

    return new ethers.Contract(contractAddress, deployment.abi, provider);
  }
}

module.exports = ContractFactory;
