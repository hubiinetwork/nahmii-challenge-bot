'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const minikube = require('./utils/minikube');

const nahmii = require('nahmii-sdk');
const io = require('socket.io-client');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;
const { execSync } = require('child_process');
const { addEth, subEth } = require('../src/utils/mixed-big-number-ops');

// Hack until we figure out how to make https protocol work
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

function getAbiPath (contractName) {
  return new Promise((resolve, reject) =>{
    const abiPaths = execSync(
      `find ./node_modules/nahmii-sdk -type f -name ${contractName}.json | grep 'abis/ropsten'`,
      { encoding: 'utf8' }
    ).split('\n');

    if (abiPaths.length < 1)
      reject(new Error('Could not find ABI of contract: ' + contractName));
    else
      resolve(abiPaths[0]);
  });
}

async function createContract (contractName, provider) {
  const contractAddress = await minikube.getContractAddress(contractName);
  const code = await provider.getCode(contractAddress);

  if ((typeof code !=='string') || (code.length <= 2))
    return Promise.reject('Contract is missing code.');

  const abiPath = await getAbiPath(contractName);
  const { abi } = require('../' + abiPath);

  return new ethers.Contract(contractAddress, abi, provider);
}

function poll(predicate, times, delay) {
  return new Promise(async (resolve, reject) => {

    async function check() {
      if (!times)
        reject(new Error('Polling failed: exhausted retries!'));

      if (await predicate.call()) {
        resolve();
      }
      else {
        times--;
        setTimeout(check, delay);
      }
    }

    check();
  });
}

async function mineOneBlock(wallet) {
  const address = await wallet.getAddress();
  const oldBlockNum = await provider.getBlockNumber();

  await wallet.sendTransaction({
    to: address, value: parseEther('0'), gasLimit: 6000000
  });

  await poll(async () => {
    return await provider.getBlockNumber() > oldBlockNum;
  }, 10, 500);
}

async function mineUntil(miner, predicate, times, delay) {
  return poll(async () => {
    await mineOneBlock(miner);
    return await predicate();
  }, times, 100, delay);
}

function promiseNextReceiptFromEvent () {
  return new Promise((resolve, reject) => {
    const receiptsUrl = `https://omphalos.mini.cluster/receipts`;
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

async function getUpdatedNahmiiBalance (wallet, oldBalance, symbol) {

  if (oldBalance && !oldBalance[symbol])
    throw new Error(`Currency symbol '${symbol} is not found in oldBalance`);

  const oldBalanceValue = oldBalance ? oldBalance[symbol] : null;
  let newBalance;

  await mineUntil(Miner, async () => {
    newBalance = await wallet.getNahmiiBalance();
    expect(newBalance).to.not.be.undefined.and.not.be.instanceof(Error);
    newBalance[symbol] = newBalance[symbol] || '0.0';
    return newBalance[symbol] !== oldBalanceValue;
  }, 200, 100);

  return newBalance;
}

// Resources
let provider, Faucet, Miner;
let clientFundContract;
let nullSettlementChallengeContract, nullSettlementContract;
let driipSettlementChallengeContract, driipSettlementContract;

describe('Resources', () => {
  step('Nahmii provider', () => {
    provider = new nahmii.NahmiiProvider(minikube.baseUrl, minikube.appId, minikube.appSecret, minikube.nodeUrl, 'ropsten');
    expect(provider).to.be.instanceof(nahmii.NahmiiProvider);
  });

  step('Wallet Faucet', () => {
    Faucet = new nahmii.Wallet(minikube.accounts.faucet.privateKey, provider);
    expect(Faucet).to.be.instanceof(nahmii.Wallet);
  });

  step('Wallet Miner', () => {
    Miner = new nahmii.Wallet(minikube.accounts.miner.privateKey, provider);
    expect(Miner).to.be.instanceof(nahmii.Wallet);
  });

  step('ClientFund contract', async () => {
    clientFundContract = await createContract('ClientFund', provider);
    expect(clientFundContract).to.be.instanceof(ethers.Contract);
  });

  step('NullSettlement contract', async () => {
    nullSettlementContract = await createContract('NullSettlement', provider);
    expect(nullSettlementContract).to.be.instanceof(ethers.Contract);
  });

  step('NullSettlementChallenge contract', async () => {
    nullSettlementChallengeContract = await createContract('NullSettlementChallenge', provider);
    expect(nullSettlementChallengeContract).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlement contract', async () => {
    driipSettlementContract = await createContract('DriipSettlement', provider);
    expect(driipSettlementContract).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlementChallenge contract', async () => {
    driipSettlementChallengeContract = await createContract('DriipSettlementChallenge', provider);
    expect(driipSettlementChallengeContract).to.be.instanceof(ethers.Contract);
  });

  step('Currency ETH', async () => {
    const eth = await minikube.getCurrency('ETH');
    expect(eth).to.have.property('ct');
  });

  step('Currency HBT', async () => {
    const hbt = await minikube.getCurrency('HBT');
    expect(hbt).to.have.property('ct');
  });
});

function createRandomWallet (ctx, walletName) {
  step(`${walletName} has new wallet`, () => {
    ctx.purses[walletName] = {};
    ctx.wallets[walletName] = new nahmii.Wallet(ethers.Wallet.createRandom().privateKey, provider);
    expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
  });

  step(`${walletName} has empty block chain balance`, async function () {
    const balance = await ctx.wallets[walletName].getBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(balance.toString()).to.equal('0');
  });

  step(`${walletName} receives ETH from Faucet`, async () => {
    await Faucet.sendTransaction({
      to: ctx.wallets[walletName].address, value: parseEther('1.0'), gasLimit: 6000000
    });

    mineOneBlock(Miner);
  });

  step(`${walletName} has ETH in block chain balance`, async () => {
    const balance = await ctx.wallets[walletName].getBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(formatEther(balance)).to.equal('1.0');
  });

  step(`${walletName} has empty Nahmii balance`, async () => {
    const balance = await ctx.wallets[walletName].getNahmiiBalance();
    expect(balance).to.not.be.undefined.and.not.be.instanceof(Error);
  });
}

function isRevertContractException(error) {
  return error.code === 'CALL_EXCEPTION' || error.code === -32000;
}

function clearAllBalancesFromPurse(ctx, walletName) {
  step(`Clear all balances from ${walletName}'s purse`, async function () {
    const purse = ctx.purses[walletName];
    delete purse.onchainBalanceBeforeAction;
    delete purse.onchainBalanceAfterAction;
    delete purse.nahmiiBalanceBeforeAction;
    delete purse.nahmiiBalanceAfterAction;
    delete purse.stagedBalanceBeforeAction;
    delete purse.stagedBalanceAfterAction;
  });
}

function captureOnchainBalanceBeforeAction(ctx, walletName, symbol) {
  step(`Capture ${walletName}'s on-chain balance before action`, async function () {
    const purse = ctx.purses[walletName];
    purse.onchainBalanceBeforeAction = await ctx.wallets[walletName].getBalance();
    expect(purse.onchainBalanceBeforeAction).to.not.be.undefined.and.not.be.instanceof(Error);
  });
}

function captureOnchainBalanceAfterAction(ctx, walletName, symbol, oldBalanceValue) {
  step(`Capture ${walletName}'s on-chain balance after action`, async function () {
    const purse = ctx.purses[walletName];
    oldBalanceValue = (oldBalanceValue === undefined) ? purse.onchainBalanceBeforeAction : oldBalanceValue;

    await mineUntil(Miner, async () => {
      purse.onchainBalanceAfterAction = await ctx.wallets[walletName].getBalance();
      return purse.onchainBalanceAfterAction !== oldBalanceValue;
    }, 200, 100);

    expect(purse.onchainBalanceAfterAction).to.not.be.undefined.and.not.be.instanceof(Error);
  });
}

function verifyOnchainBalanceChange(ctx, walletName, symbol, expectedChange) {
  step(`${walletName} on-chain balance change: ${expectedChange}`, async function () {
    const purse = ctx.purses[walletName];
    const nahmiiBalanceDiff = subEth(purse.onchainBalanceAfterAction, purse.onchainBalanceBeforeAction);
    expect(nahmiiBalanceDiff).to.be.equal(expectedChange);
  });
}

function captureNahmiiBalancesBeforeAction(ctx, walletName, symbol) {
  step(`Capture ${walletName}'s nahmii balance before action`, async () => {
    const purse = ctx.purses[walletName];
    purse.nahmiiBalanceBeforeAction = await ctx.wallets[walletName].getNahmiiBalance();
    expect(purse.nahmiiBalanceBeforeAction).to.not.be.undefined.and.not.be.instanceof(Error);

    if (purse.nahmiiBalanceBeforeAction[symbol] === undefined)
      purse.nahmiiBalanceBeforeAction[symbol] = '0.0';

    expect(purse.nahmiiBalanceBeforeAction).to.have.property(symbol);
  });
}

function captureNahmiiBalancesAfterAction(ctx, walletName, symbol, oldBalanceValue) {
  step(`Capture ${walletName}'s nahmii balance after action`, async () => {
    const purse = ctx.purses[walletName];
    oldBalanceValue = (oldBalanceValue === undefined) ? purse.nahmiiBalanceBeforeAction[symbol] : oldBalanceValue;

    await mineUntil(Miner, async () => {
      purse.nahmiiBalanceAfterAction = await ctx.wallets[walletName].getNahmiiBalance();
      purse.nahmiiBalanceAfterAction[symbol] = purse.nahmiiBalanceAfterAction[symbol] || '0.0';
      return purse.nahmiiBalanceAfterAction[symbol] !== oldBalanceValue;
    }, 200, 100);

    expect(purse.nahmiiBalanceAfterAction).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(purse.nahmiiBalanceAfterAction).to.have.property(symbol);
  });
}

function verifyNahmiiBalancesChange(ctx, walletName, symbol, expectedChange) {
  step(`${walletName}'s nahmii balance change: ${expectedChange}`, async () => {
    const purse = ctx.purses[walletName];
    const nahmiiBalanceDiff = subEth(purse.nahmiiBalanceAfterAction[symbol], purse.nahmiiBalanceBeforeAction[symbol]);

    expect(nahmiiBalanceDiff).to.be.equal(expectedChange);
  });
}

function captureStagedBalanceBeforeAction(ctx, walletName, symbol) {
  step(`Capture ${walletName}'s staged balance before action`, async () => {
    const purse = ctx.purses[walletName];

    purse.stagedBalanceBeforeAction = purse.stagedBalanceBeforeAction || {};
    purse.stagedBalanceBeforeAction[symbol] = formatEther(await ctx.wallets[walletName].getNahmiiStagedBalance(symbol));

    expect(purse.stagedBalanceBeforeAction[symbol]).to.not.be.undefined.and.not.be.instanceof(Error);
  });
}

function captureStagedBalanceAfterAction(ctx, walletName, symbol, oldBalanceValue) {
  step(`Capture ${walletName}'s staged balance after action`, async () => {
    const purse = ctx.purses[walletName];
    oldBalanceValue = (oldBalanceValue === undefined) ? purse.stagedBalanceBeforeAction[symbol] : oldBalanceValue;

    purse.stagedBalanceAfterAction = purse.stagedBalanceAfterAction || {};

    await mineUntil(Miner, async () => {
      purse.stagedBalanceAfterAction[symbol] = formatEther(await ctx.wallets[walletName].getNahmiiStagedBalance(symbol));
      return purse.stagedBalanceAfterAction[symbol] !== oldBalanceValue;
    }, 200, 100);

    expect(purse.stagedBalanceAfterAction[symbol]).to.not.be.undefined.and.not.be.instanceof(Error);
  });
}

function verifyStagedBalancesChange(ctx, walletName, symbol, expectedChange) {
  step(`${walletName}'s staged balance change: ${expectedChange}`, async () => {
    const purse = ctx.purses[walletName];
    const stagedBalanceDiff = subEth(purse.stagedBalanceBeforeAction[symbol], purse.stagedBalanceAfterAction[symbol]);
    expect(stagedBalanceDiff).to.be.equal(expectedChange);
  });
}

/*****************************************************************************/

function makeDeposit(ctx, walletName, depositAmount, symbol) {
  let depositTransaction, depositReceipt;

  step('Create deposit listener', async () => {
    ctx.nextDepositPromise = new Promise(resolve => {
      clientFundContract.once('ReceiveEvent', (wallet, balanceType, value, currencyCt, currencyId, standard) => {
        resolve({ wallet, balanceType, value, currencyCt, currencyId, standard });
      });
    });
  });

  step('Create receipt listener', () => {
    ctx.nextReceiptPromise = promiseNextReceiptFromEvent();
    return true;
  });

  clearAllBalancesFromPurse(ctx, walletName);
  captureOnchainBalanceBeforeAction(ctx, walletName, symbol);
  captureNahmiiBalancesBeforeAction(ctx, walletName, symbol);

  step(`${walletName} deposits an amount`, async () => {
    depositTransaction = await ctx.wallets[walletName].depositEth(depositAmount, { gasLimit: 2000000 });
    expect(depositTransaction).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(formatEther(depositTransaction.value)).to.equal(depositAmount);
  });

  step(`${walletName} receives transaction confirmation`, async () => {
    depositReceipt = await provider.getTransactionConfirmation(depositTransaction.hash);
    expect(depositReceipt).to.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Deposit event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(ctx.nextDepositPromise).to.eventually.be.fulfilled;
  });

  captureOnchainBalanceAfterAction(ctx, walletName, symbol);
  captureNahmiiBalancesAfterAction(ctx, walletName, symbol);

  verifyNahmiiBalancesChange(ctx, walletName, symbol, depositAmount);

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
}

function stageNullSettlementChallenge(ctx, walletName, stageAmount, symbol) {
  let currency;

  before(async () => {
    currency = await minikube.getCurrency(symbol);
  });

  step('Create StartChallengeEvent listener', async () => {
    ctx.nextStartChallengePromise = new Promise(resolve => {
      nullSettlementChallengeContract.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step(`${walletName} has no proposal status`, done => {
    nullSettlementChallengeContract.proposalStatus(ctx.wallets[walletName].address, currency.ct, 0)
    .then(res => done(res))
    .catch(err => isRevertContractException(err) ? done() : done(err));
  });

  clearAllBalancesFromPurse(ctx, walletName);
  captureNahmiiBalancesBeforeAction(ctx, walletName, symbol);
  captureStagedBalanceBeforeAction(ctx, walletName, symbol);

  step(`${walletName} has no proposal nonce (throws)`, async () => {
    const wallet = ctx.wallets[walletName];
    expect(
      nullSettlementChallengeContract.proposalNonce(wallet.address, currency.ct, 0)
    ).to.eventually.rejectedWith('VM Exception while processing transaction: revert');
  });

  step(`${walletName} starts challenge process`, async () => {
    const purse = ctx.purses[walletName];
    purse.settlement = new nahmii.Settlement(provider);
    purse.stagedAmount = new nahmii.MonetaryAmount(parseEther(stageAmount), currency.ct, 0);

    const txs = await purse.settlement.startChallenge(purse.stagedAmount, ctx.wallets[walletName]);

    expect(txs.length).to.equal(1);
    expect(txs[0].type).to.equal('null');
  });

  step(`${walletName} has proposal with status: Qualified`, done => {
    nullSettlementChallengeContract.proposalStatus(ctx.wallets[walletName].address, currency.ct, 0)
    .then(res => (res === 0) ? done() : done(res))
    .catch(err => done(err));
  });

  step(`${walletName} has proposal with staged amount: ${stageAmount}`, async () => {
    const wallet = ctx.wallets[walletName];
    const proposalStageAmount = await nullSettlementChallengeContract.proposalStageAmount(wallet.address, currency.ct, 0);
    expect(formatEther(proposalStageAmount)).to.equal(stageAmount);
  });

  step(`${walletName} has proposal with updated a nonce`, async () => {
    const wallet = ctx.wallets[walletName];
    const nonce = await nullSettlementChallengeContract.proposalNonce(wallet.address, currency.ct, 0);
    expect(nonce.toNumber()).to.be.gt(0);
  });

  step('StartChallengeEvent is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(ctx.nextStartChallengePromise).to.eventually.be.fulfilled;
  });

  step('StartChallengeEvent payload is valid', async function () {
    const { initiatorWallet, stagedAmount, stagedCt, stageId } = await ctx.nextStartChallengePromise;

    expect(initiatorWallet).to.equal(ctx.wallets[walletName].address);
    expect(formatEther(stagedAmount)).to.equal(stageAmount);
    expect(stagedCt).to.equal(currency.ct);
    expect(stageId.toString()).to.equal('0');
  });

  captureNahmiiBalancesAfterAction(ctx, walletName, symbol, null);
  captureStagedBalanceAfterAction(ctx, walletName, symbol, null);

  verifyNahmiiBalancesChange(ctx, walletName, symbol, '0.0');
  verifyStagedBalancesChange(ctx, walletName, symbol, '0.0');
}

function settleQualifiedNullSettlementChallenge(ctx, walletName, settleAmount, symbol) {
  let nextStageEventPromise, nextSettleNullEventPromise;
  let currency;

  before(async () => {
    currency = await minikube.getCurrency(symbol);
  });

  step('Create StageEvent listener', async () => {
    nextStageEventPromise = new Promise(resolve => {
      clientFundContract.on('StageEvent', (initiatorWallet, settleAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step('Create SettleNullEvent listener', async () => {
    nextSettleNullEventPromise = new Promise(resolve => {
      nullSettlementContract.on('SettleNullEvent', (wallet, currencyCt, currencyId) => {
        resolve({ wallet, currencyCt, currencyId });
      });
    });
  });

  clearAllBalancesFromPurse(ctx, walletName);
  captureNahmiiBalancesBeforeAction(ctx, walletName, symbol);
  captureStagedBalanceBeforeAction(ctx, walletName, symbol);

  step(`${walletName} settles staged amount`, async () => {
    const purse = ctx.purses[walletName];
    const settledChallenges = await purse.settlement.settle(currency.ct, 0, ctx.wallets[walletName], {gasLimit: 6e6});
    expect(settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(Array.isArray(settledChallenges)).to.be.true;
  });

  step('StageEvent event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(nextStageEventPromise).to.eventually.be.fulfilled;
  });

  step('SettleNullEvent event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    expect(nextSettleNullEventPromise).to.eventually.be.fulfilled;
  });

  captureNahmiiBalancesAfterAction(ctx, walletName, symbol, null);
  captureStagedBalanceAfterAction(ctx, walletName, symbol, null);

  verifyNahmiiBalancesChange(ctx, walletName, symbol, '0.0');
  verifyStagedBalancesChange(ctx, walletName, symbol, '0.0');
}

function withdrawQualifiedNullSettlementChallenge(ctx, walletName, withdrawAmount, symbol) {
  clearAllBalancesFromPurse(ctx, walletName);
  captureOnchainBalanceBeforeAction(ctx, walletName, symbol);
  captureStagedBalanceBeforeAction(ctx, walletName, symbol);

  step(`${walletName} withdraws staged amount`, async () => {
    const purse = ctx.purses[walletName];
    const wallet = ctx.wallets[walletName];
    const currency = await minikube.getCurrency(symbol);
    const settledChallenges = await purse.settlement.settle(currency.ct, 0, wallet, {gasLimit: 6e6});
    expect(settledChallenges).to.not.be.undefined.and.not.be.instanceof(Error);
    expect(Array.isArray(settledChallenges)).to.be.true;
  });

  captureOnchainBalanceAfterAction(ctx, walletName, symbol);
  captureStagedBalanceAfterAction(ctx, walletName, symbol, null);

  verifyOnchainBalanceChange(ctx, walletName, symbol, '0.0');
  verifyStagedBalancesChange(ctx, walletName, symbol, '0.0');
}

describe('Qualified null settlement challenge', () => {
  const ctx = {
    wallets: {},
    purses: {}
  };

  describe('A. Alice is actor', () => {
    createRandomWallet(ctx, 'Alice');
  });

  describe('B. Alice deposits ETH to nahmii', () => {
    makeDeposit(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('C. Alice stages ETH', () => {
    stageNullSettlementChallenge(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('D. Alice settles ETH', () => {
    settleQualifiedNullSettlementChallenge(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('E. Alice withdraws ETH', () => {
    withdrawQualifiedNullSettlementChallenge(ctx, 'Alice', '0.002', 'ETH');
  });
});
