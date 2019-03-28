'use strict';

const chai = require('chai');
const minikube = require('../utils/minikube');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');
const NestedError = require('../../src/utils/nested-error');

function poll(predicate, times, delay) {
  return new Promise(async (resolve, reject) => {

    async function check() {
      if (!times)
        reject(new Error('Polling exhausted retries!'));

      if (await predicate.call()) {
        resolve();
      }
      else {
        times--;
        setTimeout(check, delay);
      }
    }

    check();
  });
}

// This number must match the polling speed of the ethers provider.
// Ensure that there are no more than max 12 blocks mined per ethers provider poll.
// Otherwise ethers will start to drop events.

const minMiningInterval = 300;

class Miner extends nahmii.Wallet {

  constructor(privateKey, provider) {
    super(privateKey, provider);
  }

  async advanceTime (timeDiff) {
    this.provider.send('evm_increaseTime', [timeDiff]);
    this.provider.send('evm_mine', []);
    await new Promise(resolve => this.provider.once('block', resolve));
  }

  async mineOnce () {
    // Send one transaction which triggers ganache mining
    try {
      await this.sendTransaction({
        to: await this.getAddress(), value: ethers.utils.parseEther('0'), gasLimit: 6000000
      });
    }
    catch (err) {
      throw new NestedError(err, 'Miner.mineOnce() failed. ' + err.message);
    }
  }

  async mineOneBlock () {
    try {
      await this.mineOnce();
      await new Promise(resolve => this.provider.once('block', resolve));
    }
    catch (err) {
      throw new NestedError(err, 'Miner.mineOneBlock() failed. ' + err.message);
    }
  }

  async mineUntil (predicate) {
    const ethersBlockLimit = 12; // Ethers discards events more than 12 blocks old
    const maxBlocksPerInterval = ethersBlockLimit / 2;
    const timeoutMs = 15000;
    const retryCount = maxBlocksPerInterval * timeoutMs / this.provider.pollingInterval;
    const miningInterval = this.provider.pollingInterval / maxBlocksPerInterval;

    return poll(async () => {
      const isDone = await predicate();

      try {
        if (! isDone)
          await this.mineOnce();
      }
      catch (err) {
        throw new NestedError(err, 'Miner.mineUntil() failed. ' + err.message);
      }

      process.stdout.write(`${await this.provider.getBlockNumber()}\r`);

      return isDone;

    }, retryCount, miningInterval)
    .catch(async err => {
      err.message += ` Gave up mining at block no: ${await this.provider.getBlockNumber()}`;
      return Promise.reject(err);
    });
  }

  async mineCount (count = 1) {
    try {
      await this.mineOnce();

      for (let i = 1; i < count; ++i) {
        await this.mineOnce();

        // Slow down according to Ethers polling capacity.
        // Ethers drops log/events that has more than 12 blocks coverage per poll.
        await new Promise(resolve => setTimeout(resolve, this.provider.pollingInterval / 6));
      }
    }
    catch (err) {
      throw new NestedError(err, 'Miner.mineCount() failed. ' + err.message);
    }
  }
}

module.exports = function (ctx) {
  step('Miner driving blockchain forward', async function () {
    ctx.Miner = new Miner(minikube.accounts.miner.privateKey, ctx.provider);
    const balance = ethers.utils.formatEther(await ctx.Miner.getBalance());
    this.test.title += `\n        ${ctx.Miner.address}, ${balance} ETH`;
    chai.expect(ctx.Miner).to.be.instanceof(nahmii.Wallet);
    chai.expect(ctx.Miner).to.be.instanceof(Miner);
  });
};
