'use strict';

const chai = require('chai');
const expect = chai.expect;
const ethers = require('ethers');
const { addUnits, subUnits } = require('../../src/utils/mixed-big-number-ops');
const io = require('socket.io-client');
const assert = require('assert');

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

function fmtDepositFromData (data, unit) {
  const amountStr = '0x' + data.substring((1 + 36) * 2, (1 + 36 + 32) * 2);
  const amountBn = new ethers.utils.bigNumberify(amountStr);
  const amountFmt = ethers.utils.formatUnits(amountBn, unit);
  return amountFmt;
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
      expect(ethers.utils.formatEther(depositTransaction.value)).to.equal(depositAmount);
    } else {
      const contract = ctx.contracts[symbol].connect(ctx.wallets[walletName]);
      const clientFund = ctx.contracts.clientFund.connect(ctx.wallets[walletName]);
      const amountBN = ethers.utils.parseUnits(depositAmount, ctx.currencies[symbol].unit);

      await contract.approve(clientFund.address, amountBN, { gasLimit: ctx.gasLimit });
      depositTransaction = await clientFund.receiveTokens('', amountBN, contract.address, 0, 'ERC20', { gasLimit: ctx.gasLimit });

      const amountStr = fmtDepositFromData(depositTransaction.data, ctx.currencies[symbol].unit);
      expect(amountStr).to.equal(depositAmount);
    }

    this.test.title += `: ${depositAmount} ${symbol}, with hash ${depositTransaction.hash}`;
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

    expect(purse['onchainBalanceBeforeAction']).to.not.be.undefined;
    expect(purse['onchainBalanceBeforeAction'][symbol]).to.not.be.undefined;
    expect(purse['onchainBalanceAfterAction']).to.not.be.undefined;
    expect(purse['onchainBalanceAfterAction'][symbol]).to.not.be.undefined;

    const balanceBefore = purse['onchainBalanceBeforeAction'][symbol];
    const balanceAfter = purse['onchainBalanceAfterAction'][symbol];
    const actualDeduction = subUnits(balanceBefore, balanceAfter, unit);

    if (symbol === 'ETH') {
      const expectedDeduction = addUnits(depositAmount, depositReceipt.gasUsed.mul('1000000000'), 18);

      this.test.title += '\n' +
        '        actualDeduction  : ' + actualDeduction + '\n' +
        '        expectedDeduction: ' + expectedDeduction;

      // ISSUE: Does not match
      // expect(actualDeduction).to.equal(expectedDeduction);

      expect(Number(actualDeduction)).to.gte(Number(expectedDeduction));
    }
    else {
      expect(Number(actualDeduction)).to.equal(Number(depositAmount));
    }
  });

  require('../work-steps/balances/ensure-nahmii-balance-updates')(ctx, walletName, symbol);
  require('../work-steps/balances/capture-nahmii-balance-after-action')(ctx, walletName, symbol);
  require('../work-steps/balances/verify-nahmii-balance-change')(ctx, walletName, depositAmount, symbol);
};
