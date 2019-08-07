'use strict';

const providerFactory = require('../../nahmii-provider-factory');

class SearchRange {
  constructor (provider, fromBlock, toBlock) {
    this.provider = provider;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
  }

  static async create (provider) {
    const fromBlock = await provider.getBlock(0);
    const toBlock = await provider.getBlock(await provider.getBlockNumber());

    return new SearchRange(provider, fromBlock, toBlock);
  }

  async setFromBlock (blockNo) {
    this.fromBlock = await this.provider.getBlock(blockNo);
  }

  async setToBlock (blockNo) {
    this.toBlock = await this.provider.getBlock(blockNo);
  }

  size () {
    return this.toBlock.number - this.fromBlock.number + 1;
  }

  midBlockNo () {
    return Math.floor((this.fromBlock.number + this.toBlock.number) / 2);
  }

  async getMidBlock () {
    return await this.provider.getBlock(this.midBlockNo());
  }
}

class BinaryBlockSearcher {
  static async findBlockLte (cmpFn) {

    const provider = await providerFactory.acquireProvider();
    const searchRange = await SearchRange.create(provider);

    while (searchRange.size() > 1) {
      const pilotBlock = await searchRange.getMidBlock();
      const relativePilotPosition = cmpFn(pilotBlock);

      if (relativePilotPosition < 0) {
        // [p<=] -> [<=] or [p=] -> [=] or [p<>] -> [<>] or [p>] -> [>]
        await searchRange.setFromBlock(pilotBlock.number + 1);
      }
      else if (relativePilotPosition > 0) {
        // [=>p] -> [=>] or [=p] -> [=] or [<>p] -> [<]
        await searchRange.setToBlock(pilotBlock.number - 1);
      }
      else {
        // Exact match
        searchRange.fromBlock = searchRange.toBlock = pilotBlock;
      }
    }

    let candidateBlock = searchRange.fromBlock; // size === 1

    if (cmpFn(candidateBlock) > 0) {
      if (candidateBlock.number === 0)
        throw new Error('Binary search failed. Attempt to access block number -1.');
      else
        candidateBlock = await provider.getBlock(candidateBlock.number - 1);
    }

    return candidateBlock;
  }
}

module.exports = BinaryBlockSearcher;