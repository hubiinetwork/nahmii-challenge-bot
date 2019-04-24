'use strict';

const { logger } = require('@hubiinetwork/logger');
const ethers = require('ethers');
const ClusterInformation = require('../cluster-information');
const abiProvider = require('./abi-provider');

class ContractFactory {
  static async create (contractName, provider) {
    const clusterInfo = new ClusterInformation();
    const ethereum = await clusterInfo.acquireEthereum();
    const contractAddress = ethereum.contracts[contractName];

    if (!contractAddress)
      throw new Error(`Failed to find contract address for '${contractName}' in meta service`);

    const abiInfo = abiProvider.getAbiInfo(contractName, ethereum.net);

    if (!abiInfo.networks)
      throw new Error(`Failed to find property 'networks' in abi info for '${contractName}'`);

    if (abiInfo.networks[provider.network.chainId].address !== contractAddress) {
      const msg = 'Contract addresses do not match.\n' +
      `        ${contractName}\n` +
      `        meta service : ${contractAddress}\n` +
      `        abi address  : ${abiInfo.networks[provider.network.chainId].address}`;

      if (process.env.NODE_ENV === 'production')
        throw new Error(msg);
      else
        logger.info(msg);
    }

    return new ethers.Contract(contractAddress, abiInfo.abi, provider);
  }
}

module.exports = ContractFactory;
