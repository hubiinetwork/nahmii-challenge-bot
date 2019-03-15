'use strict';

const chai = require('chai');
const minikube = require('../utils/minikube');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');

function poll(predicate, times, delay) {
  return new Promise(async (resolve, reject) => {

    async function check() {
      if (!times)
        reject(new Error('Polling failed: exhausted retries!'));

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

class Miner extends nahmii.Wallet {

  constructor(privateKey, provider) {
    super(privateKey, provider);
  }

  async mineOneBlock() {
    const address = await this.getAddress();
    const oldBlockNum = await this.provider.getBlockNumber();

    await this.sendTransaction({
      to: address, value: ethers.utils.parseEther('0'), gasLimit: 6000000
    });

    await poll(async () => {
      return await this.provider.getBlockNumber() > oldBlockNum;
    }, 10, 500);
  }

  async mineUntil(predicate, times, delay) {
    return poll(async () => {
      await this.mineOneBlock();
      return await predicate();
    }, times, 100, delay);
  }
}

module.exports = function (ctx) {
  step('Miner driving blockchain forward', () => {
    ctx.Miner = new Miner(minikube.accounts.miner.privateKey, ctx.provider);
    chai.expect(ctx.Miner).to.be.instanceof(nahmii.Wallet);
    chai.expect(ctx.Miner).to.be.instanceof(Miner);
  });
};
