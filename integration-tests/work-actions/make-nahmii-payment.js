'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');
const { formatEther, parseEther, bigNumberify } = ethers.utils;
const nahmii = require('nahmii-sdk');

module.exports = function (ctx, senderName, recipientName, receiptName, amount, symbol) {

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, senderName);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, senderName, symbol);

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, recipientName);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, recipientName, symbol);


  step(`${senderName} prepares payment to ${recipientName}`, async () => {
    const senderWallet = ctx.wallets[senderName];
    const recipientWallet = ctx.wallets[recipientName];
    const senderPurse = ctx.purses[senderName];

    const monetaryAmount = nahmii.MonetaryAmount.from(parseEther(amount), ctx.currencies[symbol].ct);
    senderPurse.payment = new nahmii.Payment(monetaryAmount, senderWallet.address, recipientWallet.address, senderWallet);

    expect(senderPurse.payment).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step(`${senderName} signs payment`, async () => {
    const payment = ctx.purses[senderName].payment;
    expect(payment.isSigned()).to.be.false;

    await ctx.purses[senderName].payment.sign();

    expect(payment.isSigned()).to.be.true;
  });

  step(`${senderName} registers payment`, async function () {
    this.timeout(8000);
    const res = await ctx.purses[senderName].payment.register();
    expect(formatEther(bigNumberify(res.amount))).to.equal(amount);
    this.test.title += ` at ${res.blockNumber} ${res.id}`;
  });

  require('../work-steps/receipts/ensure-latest-receipt-updates')(ctx, senderName, symbol);
  require('../work-steps/receipts/capture-latest-receipt')(ctx, 'Capture latest receipt', senderName, receiptName, symbol);

  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, senderName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, senderName, '-' + (Number(amount)*1.001).toString(), symbol);

  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, recipientName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, recipientName, amount, symbol);
};
