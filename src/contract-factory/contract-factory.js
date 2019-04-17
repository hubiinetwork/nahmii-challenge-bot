'use strict';

const ethers = require('ethers');
const ClusterInformation = require('../cluster-information');
const abiProvider = require('./abi-provider');

class ContractFactory {
  static async create (contractName, provider) {
    const ethereum = await ClusterInformation.getEthereum();
    const contractAddress = ethereum.contracts[contractName];
    const abiPath = abiProvider.getAbiPath(contractName, ethereum.net);
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
