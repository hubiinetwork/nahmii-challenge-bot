'use strict';

const chai = require('chai');
const expect = chai.expect;
const NestedError = require('../../../src/utils/nested-error');
const ethers = require('ethers');

module.exports = (ctx) => {
  step('ClientFund ReceiveEvent is observed', async function () {
    // ON TIMEOUT: HAVE YOU RUN ABI PATCHING OF NAHMII-SDK?
    this.timeout(16000);
    try {
      await ctx.Miner.mineOneBlock();
      await ctx.Miner.mineOneBlock();
/*
      const latestBlock = await ctx.provider.getBlockNumber('latest');

      const logs = await ctx.provider.getLogs({
        fromBlock: latestBlock-10,
        toBlock: latestBlock
      });

      const topic = ethers.utils.id('ReceiveEvent(address,string,int256,address,uint256,string)');
      const abi = [ "event ReceiveEvent(address wallet, string balanceType, int256 value, address currencyCt, uint256 currencyId, string standard)" ];
      const iface = new ethers.utils.Interface(abi);
      const events = logs.map((log) => iface.parseLog(log));

      events.forEach(ev => console.log('validate-ClientFund-ReceiveEvent-promise.js' + JSON.stringify(ev)));
*/
    }
    catch (err) {
      throw new NestedError (err, 'Failed to mine block. ' + err.message);
    }
    return expect(ctx.promises.ReceiveEvent).to.eventually.be.fulfilled;
  });
};
