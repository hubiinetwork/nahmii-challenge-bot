'use strict';

const chai = require('chai');
const expect = chai.expect;
const { formatUnits, parseUnits, bigNumberify } = require('ethers').utils;
const nahmii = require('nahmii-sdk');

module.exports = function (ctx, senderName, recipientName, receiptName, amount, symbol) {

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, senderName);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, senderName, symbol);

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, recipientName);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, recipientName, symbol);


  step(`${senderName} prepares payment overdraw to ${recipientName}`, async () => {
    const senderWallet = ctx.wallets[senderName];
    const recipientWallet = ctx.wallets[recipientName];
    const senderPurse = ctx.purses[senderName];
    const unit = ctx.currencies[symbol].unit;

    const monetaryAmount = nahmii.MonetaryAmount.from(parseUnits(amount, unit), ctx.currencies[symbol].ct);
    senderPurse.payment = new nahmii.Payment(monetaryAmount, senderWallet.address, recipientWallet.address, senderWallet);

    expect(senderPurse.payment).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step(`${senderName} signs payment overdraw`, async () => {
    const payment = ctx.purses[senderName].payment;
    expect(payment.isSigned()).to.be.false;

    await ctx.purses[senderName].payment.sign();

    expect(payment.isSigned()).to.be.true;
  });

  step(`${senderName} registers payment overdraw`, function () {
    this.timeout(8000);
    return expect(ctx.purses[senderName].payment.register()).to.eventually.be.rejectedWith(/Insufficient funds/);
  });

  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, senderName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, senderName, '0', symbol);

  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, recipientName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, recipientName, '0', symbol);
};
