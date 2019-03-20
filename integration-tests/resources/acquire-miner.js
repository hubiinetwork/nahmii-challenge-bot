'use strict';

const chai = require('chai');
const minikube = require('../utils/minikube');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');

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

  async mineOnce () {
    // Send one transaction which triggers ganache mining
    await this.sendTransaction({
      to: await this.getAddress(), value: ethers.utils.parseEther('0'), gasLimit: 6000000
    });
  }

  async mineOneBlock () {
    await this.mineOnce();
    await new Promise(resolve => this.provider.once('block', resolve));
  }

  async mineUntil (predicate) {
    return poll(async () => {
      const isDone = await predicate();

      if (! isDone)
        await this.mineOnce();

      process.stdout.write(`${await this.provider.getBlockNumber()}${isDone ? '\n' : '\r'}`);

      return isDone;

    }, 15000 / this.provider.pollingInterval, this.provider.pollingInterval)
    .catch(async err => {
      err.message += ` Gave up mining at block no: ${await this.provider.getBlockNumber()}`;
      return Promise.reject(err);
    });
  }

  async mineCount (count = 1) {
    await this.mineOnce();

    for (let i = 1; i < count; ++i) {
      await this.mineOnce();

      // Slow down according to Ethers polling capacity.
      // Ethers drops log/events that has more than 12 blocks coverage per poll.
      await new Promise(resolve => setTimeout(resolve, this.provider.pollingInterval / 6));
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
