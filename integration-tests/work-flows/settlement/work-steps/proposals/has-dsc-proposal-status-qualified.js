'use strict';

const chai = require('chai');
const expect = chai.expect;
const { bigNumberify } = require('ethers').utils;

module.exports = function (ctx, walletName, symbol) {
  step(`${walletName} has DSC proposal with status: Qualified`, async () => {
    let status;

    try {
      const address = ctx.wallets[walletName].address;
      const ct = ctx.currencies[symbol].ct;
      const id = bigNumberify(0);
      status = await ctx.contracts.driipSettlementChallenge.proposalStatus(address, ct, id);
    }
    catch (err) {
      status = err;
    }

    expect(status).to.not.be.undefined.and.not.to.be.instanceof(Error);
    expect(status).to.to.equal(0); // Qualified
  });
};
