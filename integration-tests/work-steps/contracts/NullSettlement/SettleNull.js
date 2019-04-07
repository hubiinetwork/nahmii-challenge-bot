'use strict';

const assert = require('assert');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, symbol) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof symbol === 'string');

  step ('Current proposal is expired', async () => {
    const address = ctx.wallets[walletName].address;
    const ct = ctx.currencies[symbol].ct;
    const isExpired = ctx.contracts.nullSettlementChallenge.hasProposalExpired(address, ct, 0);
    return expect(isExpired).to.eventually.be.true;
  });

  step ('Current proposal is \'Qualified\'', async () => {
    const address = ctx.wallets[walletName].address;
    const ct = ctx.currencies[symbol].ct;
    const status = ctx.contracts.nullSettlementChallenge.proposalStatus(address, ct, 0);
    return expect(status).to.eventually.equal(0);
  });

  step ('Current proposal has valid nonce', async () => {
    const address = ctx.wallets[walletName].address;
    const ct = ctx.currencies[symbol].ct;
    try {
      const nonce = await ctx.contracts.nullSettlementChallenge.proposalNonce(address, ct, 0);
      const maxNullNonce = await ctx.contracts.nullSettlement.walletCurrencyMaxNullNonce(address, ct, 0);
      console.log(`nonce: ${nonce}`);
      console.log(`maxNullNonce: ${maxNullNonce}`);
      return expect(Promise.resolve(nonce > maxNullNonce)).to.eventually.be.true;
    }
    catch (err) {
      return expect(Promise.reject(err)).to.eventually.be.fulfilled;
    }
  });

  step (`${walletName} settles NSC`, async () => {
    const contract = ctx.contracts.nullSettlement.connect(ctx.wallets[walletName]);
    const promise = contract.settleNull(ctx.currencies[symbol].ct, 0, { gasLimit: ctx.gasLimit });

    return expect(promise).to.eventually.be.fulfilled;
  });
};
