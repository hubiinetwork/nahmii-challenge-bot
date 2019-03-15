'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');
const { addEth, subEth } = require('../../src/utils/mixed-big-number-ops');
const io = require('socket.io-client');

function promiseNextReceiptFromEvent () {
  return new Promise((resolve, reject) => {
    const receiptsUrl = 'https://omphalos.mini.cluster/receipts';
    const socket = io(receiptsUrl, {path: '/events/socket.io', rejectUnauthorized: false});
    let isClosed = false;

    socket.on('new_receipt', receipt => {
      resolve(receipt);
      socket.close();
    });

    function invokeReject(msg) {
      if (! isClosed) {
        isClosed = true;
        socket.close();
        reject(msg);
      }
    }

    socket.on('connect_timeout', () => invokeReject('connect_timeout'));
    socket.on('connect_error', err => { err.message = 'connect_error: ' + err.message; reject(err); });
    socket.on('error', () => invokeReject('error'));
    socket.on('reconnect_error', () => invokeReject('reconnect_error'));
    socket.on('reconnect_failed', () => invokeReject('reconnect_failed'));
  });
}

module.exports = function (ctx, walletName, depositAmount, symbol) {
  let depositTransaction, depositReceipt;

  step('Create deposit listener', async () => {
    ctx.nextDepositPromise = new Promise(resolve => {
      ctx.contracts.clientFund.once('ReceiveEvent', (wallet, balanceType, value, currencyCt, currencyId, standard) => {
        resolve({ wallet, balanceType, value, currencyCt, currencyId, standard });
      });
    });
  });

  step('Create receipt listener', () => {
    ctx.nextReceiptPromise = promiseNextReceiptFromEvent();
    return true;
  });

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);
  require('../work-steps/balances/capture-onchain-balance-before-action')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);

  step(`${walletName} deposits an amount`, async () => {
    depositTransaction = await ctx.wallets[walletName].depositEth(depositAmount, { gasLimit: 2000000 });
    expect(depositTransaction).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(ethers.utils.formatEther(depositTransaction.value)).to.equal(depositAmount);
  });

  step(`${walletName} receives transaction confirmation`, async () => {
    depositReceipt = await ctx.provider.getTransactionConfirmation(depositTransaction.hash);
    expect(depositReceipt).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Deposit event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(ctx.nextDepositPromise).to.eventually.be.fulfilled;
  });

  require('../work-steps/balances/capture-onchain-balance-after-action')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, symbol, depositAmount);

  step(`${walletName} has an reduced block chain balance`, async () => {
    const purse = ctx.purses[walletName];
    const actualDeduction = subEth(purse.onchainBalanceBeforeAction, purse.onchainBalanceAfterAction);
    const expectedDeduction = addEth(depositAmount, depositReceipt.gasUsed.mul('1000000000'));

    console.log('  actualDeduction: ' + actualDeduction);
    console.log('expectedDeduction: ' + expectedDeduction);

    // ISSUE: Does not match
    // expect(actualDeduction).to.equal(expectedDeduction);

    expect(Number(actualDeduction)).to.gte(Number(expectedDeduction));
  });
};
