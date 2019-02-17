'use strict';

const ethers = require('ethers');
const ClusterInformation = require('../cluster-information');

let ethProvider;

async function aquireEthProvider () {
  if (! ethProvider) {
    const ethereumUrl = await ClusterInformation.aquireEthereumUrl();
    ethProvider = new ethers.providers.JsonRpcProvider(ethereumUrl);
  }

  return ethProvider;
}

class ContractFactory {
  static async create (contractName) {
    const { abi } = require(`./abi/${contractName}.json`);
    const contractAddress = await ClusterInformation.aquireContractAddress(contractName);
    return new ethers.Contract(contractAddress, abi, await aquireEthProvider());
  }
}

module.exports = ContractFactory;