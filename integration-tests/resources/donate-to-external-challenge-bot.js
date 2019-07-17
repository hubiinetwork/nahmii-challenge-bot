'use strict';

const chai = require('chai');
const expect = chai.expect;

const { parseEther } = require('ethers').ethers.utils;

module.exports = function (ctx, walletAddress, assignedEth) {
  step(`External challenge bot ${walletAddress} receives ${assignedEth} ETH from Faucet`, async () => {
    return expect(
      ctx.Faucet.sendTransaction({
        to: walletAddress, value: parseEther(assignedEth), gasLimit: ctx.gasLimit
      }).then(
        () => ctx.Miner.mineOneBlock()
      )).to.eventually.be.fulfilled;
  });
};
