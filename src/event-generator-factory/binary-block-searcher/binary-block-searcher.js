'use strict';

const providerFactory = require('../../nahmii-provider-factory');
const t = require('../../runtime-types');

class SearchRange {
  constructor (provider, fromBlock, toBlock) {
    this.provider = provider;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
  }

  static async create (provider, fromBlockNo, toBlockNo) {
    const fromBlock = await provider.getBlock(fromBlockNo);
    const toBlock = await provider.getBlock(toBlockNo);

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
  static async findBlockLte (cmpFn, fromBlockNo, toBlockNo) {
    const provider = await providerFactory.acquireProvider();
    fromBlockNo = fromBlockNo || 0;
    toBlockNo = toBlockNo || await provider.getBlockNumber();

    t.function().assert(cmpFn);
    t.uint().assert(fromBlockNo);
    t.uint().assert(toBlockNo);

    const searchRange = await SearchRange.create(provider, fromBlockNo, toBlockNo);

    while (searchRange.size() > 1) {
      const pivotBlock = await searchRange.getMidBlock();
      const relativePilotPosition = cmpFn(pivotBlock);

      if (relativePilotPosition < 0)
        await searchRange.setFromBlock(pivotBlock.number + 1);
      else if (relativePilotPosition > 0)
        await searchRange.setToBlock(pivotBlock.number - 1);
      else
        searchRange.fromBlock = searchRange.toBlock = pivotBlock;
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