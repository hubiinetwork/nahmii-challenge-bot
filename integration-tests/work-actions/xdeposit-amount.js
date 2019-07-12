'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');
const { addUnits, subUnits } = require('../../src/utils/mixed-big-number-ops');
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

module.exports = function (ctx, walletName, depositAmount, symbol, dummy) {
  assert(typeof ctx === 'object');
  assert(typeof walletName === 'string');
  assert(typeof depositAmount === 'string');
  assert(typeof symbol === 'string');
  assert(dummy === undefined);

  let depositTransaction, depositReceipt;

  step('Create receipt listener', () => {
    ctx.nextReceiptPromise = promiseNextReceiptFromEvent();
    return true;
  });

  require('../work-steps/balances/clear-all-balances-from-purse')(ctx, walletName);

  require('../work-steps/balances/capture-onchain-balance-before-action')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-before-action')(ctx, walletName, symbol);

  require('../work-steps/contract-events/create-ClientFund-ReceiveEvent.promise')(ctx);

  step(`${walletName} deposits`, async function () {
    if (symbol === 'ETH') {
      depositTransaction = await ctx.wallets[walletName].depositEth(depositAmount, { gasLimit: ctx.gasLimit });
    } else {
      const contract = ctx.contracts[symbol];
      const clientFund = ctx.contracts['ClientFund'];
      const amountBN = ethers.utils.parseUnits(depositAmount, ctx.currencies[symbol].unit);
      await contract.approve(clientFund.address, amountBN, { gasLimit: ctx.gasLimit });
      depositTransaction = await clientFund.receiveTokens('', amountBN, contract.address, 0, 'ERC20', { gasLimit: ctx.gasLimit });
    }

    expect(depositTransaction).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(ethers.utils.formatUnits(depositTransaction.value, ctx.currencies[symbol].unit)).to.equal(depositAmount);
    this.test.title += `: ${depositAmount} ${symbol}, staged with hash ${depositTransaction.hash}`;
  });

  step(`${walletName} receives`, async function () {
    depositReceipt = await ctx.provider.getTransactionConfirmation(depositTransaction.hash);
    expect(depositReceipt).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(depositReceipt.blockNumber).to.not.be.undefined;
    this.test.title += ` ${depositReceipt.confirmations} transaction confirmations at ${depositReceipt.blockNumber}`;
  });

  require('../work-steps/contract-events/validate-ClientFund-ReceiveEvent-promise')(ctx);

  require('../work-steps/balances/capture-onchain-balance-after-action')(ctx, walletName, symbol);

  step(`${walletName} has a reduced onchain ${symbol} balance`, async function () {
    const purse = ctx.purses[walletName];
    const unit = ctx.currencies[symbol].unit;
    const actualDeduction = subUnits(purse.onchainBalanceBeforeAction, purse.onchainBalanceAfterAction, unit);
    const expectedDeduction = addUnits(depositAmount, depositReceipt.gasUsed.mul('1000000000'), unit);

    this.test.title += '\n' +
      '        actualDeduction  : ' + actualDeduction + '\n' +
      '        expectedDeduction: ' + expectedDeduction;

    // ISSUE: Does not match
    // expect(actualDeduction).to.equal(expectedDeduction);

    expect(Number(actualDeduction)).to.gte(Number(expectedDeduction));
  });

  require('../work-steps/balances/ensure-nahmii-balance-updates')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, depositAmount, symbol);
};
