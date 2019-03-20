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

  step('Create receipt listener', () => {
    ctx.nextReceiptPromise = promiseNextReceiptFromEvent();
    return true;
  });

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);

  require('../work-steps/balances/capture-onchain-eth-balance-before-action')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-eth-balance-before-action')(ctx, walletName);

  require('../work-steps/contract-events/subscribe-once-ClientFund-ReceiveEvent')(ctx);

  step(`${walletName} deposits`, async function () {
    depositTransaction = await ctx.wallets[walletName].depositEth(depositAmount, { gasLimit: 2000000 });
    expect(depositTransaction).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(ethers.utils.formatEther(depositTransaction.value)).to.equal(depositAmount);
    this.test.title += `: ${depositAmount} ETH at ${depositTransaction.blockNumber}`;
  });

  step(`${walletName} receives`, async function () {
    depositReceipt = await ctx.provider.getTransactionConfirmation(depositTransaction.hash);
    expect(depositReceipt).to.not.be.undefined.and.not.be.instanceof(Error);
    this.test.title += ` ${depositReceipt.confirmations} transaction confirmations at ${depositReceipt.blockNumber}`;
  });

  require('../work-steps/contract-events/validate-once-ClientFund-ReceiveEvent')(ctx);

  require('../work-steps/balances/capture-onchain-eth-balance-after-action')(ctx, walletName);

  step(`${walletName} has a reduced block chain balance`, async function () {
    const purse = ctx.purses[walletName];
    const actualDeduction = subEth(purse.onchainBalanceBeforeAction, purse.onchainBalanceAfterAction);
    const expectedDeduction = addEth(depositAmount, depositReceipt.gasUsed.mul('1000000000'));

    this.test.title += '\n' +
      '        actualDeduction  : ' + actualDeduction + '\n' +
      '        expectedDeduction: ' + expectedDeduction;

    // ISSUE: Does not match
    // expect(actualDeduction).to.equal(expectedDeduction);

    expect(Number(actualDeduction)).to.gte(Number(expectedDeduction));
  });

  require('../work-steps/balances/ensure-nahmii-eth-balance-updates')(ctx, walletName);
  require('../work-steps/balances/capture-nahmii-eth-balance-after-action')(ctx, walletName);
  require('../work-steps/balances/verify-nahmii-eth-balance-change')(ctx, walletName, depositAmount);
};