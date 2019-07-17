'use strict';

const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const ethers = require('ethers');

module.exports = function (ctx, walletName, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof symbol === 'string');

  step ('Current proposal is expired', async () => {
    const address = ctx.wallets[walletName].address;
    const ct = ctx.currencies[symbol].ct;
    const isExpired = ctx.contracts.nullSettlementChallengeByPayment.hasProposalExpired(address, ct, 0);
    return expect(isExpired).to.eventually.be.true;
  });

  step ('Current proposal is \'Qualified\'', async () => {
    const address = ctx.wallets[walletName].address;
    const ct = ctx.currencies[symbol].ct;
    const status = ctx.contracts.nullSettlementChallengeByPayment.proposalStatus(address, ct, 0);
    return expect(status).to.eventually.equal(0);
  });

  step ('Current proposal has valid nonce', async () => {
    const address = ctx.wallets[walletName].address;
    const ct = ctx.currencies[symbol].ct;
    try {
      const nonce = ctx.contracts.nullSettlementChallengeByPayment.proposalNonce(address, ct, 0);
      return expect(nonce).to.eventually.be.instanceOf(ethers.utils.BigNumber);
    }
    catch (err) {
      return expect(Promise.reject(err)).to.eventually.be.true;
    }
  });

  step (`${walletName} settles NSC`, async function () {
    this.timeout(16000);
    const contract = ctx.contracts.nullSettlement.connect(ctx.wallets[walletName]);
    const standard = symbol === 'ETH' ? 'ETH' : 'ERC20';
    const promise = contract.settleNull(ctx.currencies[symbol].ct, 0, standard, { gasLimit: ctx.gasLimit });
    await ctx.Miner.mineOneBlock();

    return expect(promise).to.eventually.be.fulfilled;
  });
};
