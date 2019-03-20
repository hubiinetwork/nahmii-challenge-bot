'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');
const { parseEther } = ethers.utils;
const nahmii = require('nahmii-sdk');

module.exports = function (ctx, senderName, recipientName, amount, symbol) {

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, senderName);
  require('../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, senderName);

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, recipientName);
  require('../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, recipientName);


  step(`${senderName} prepares payment to ${recipientName}`, async () => {
    const senderWallet = ctx.wallets[senderName];
    const recipientWallet = ctx.wallets[recipientName];
    const senderPurse = ctx.purses[senderName];

    const monetaryAmount = new nahmii.MonetaryAmount(parseEther(amount), ctx.currencies[symbol]);
    senderPurse.payment = new nahmii.Payment(monetaryAmount, senderWallet.address, recipientWallet.address, senderWallet);

    expect(senderPurse.payment).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step(`${senderName} signs payment`, async () => {
    const payment = ctx.purses[senderName].payment;
    expect(payment.isSigned()).to.be.false;

    ctx.purses[senderName].payment.sign();

    expect(payment.isSigned()).to.be.true;
  });

  step(`${senderName} registers payment`, async () => {
    const promisedResult = ctx.purses[senderName].payment.register();
    return expect(promisedResult).to.eventually.be.fulfilled;
  });

  require('../work-steps/balances/ensure-nahmii-eth-balance-updates')(ctx, senderName);
  require('../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, senderName);
  require('../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, senderName, '-' + amount);

  require('../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, recipientName);
  require('../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, recipientName, amount);
};
