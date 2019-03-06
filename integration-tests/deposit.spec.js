'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const minikube = require('./minikube');
const nahmii = require('nahmii-sdk');
const io = require('socket.io-client');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;
const { execSync } = require('child_process');

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

// Resources
let provider, Faucet, Miner;
let clientFundContract;
let nullSettlementChallengeContract, nullSettlementContract;
let driipSettlementChallengeContract, driipSettlementContract;
let eth;

describe('Resources', () => {
  step('Nahmii provider', () => {
    provider = new nahmii.NahmiiProvider(minikube.baseUrl, minikube.appId, minikube.appSecret, minikube.nodeUrl, 'ropsten');
    return provider.should.be.instanceof(nahmii.NahmiiProvider);
  });

  step('Wallet Faucet', () => {
    Faucet = new nahmii.Wallet(minikube.accounts[0].privateKey, provider);
    return Faucet.should.be.instanceof(nahmii.Wallet);
  });

  step('Wallet Miner', () => {
    Miner = new nahmii.Wallet(minikube.accounts[1].privateKey, provider);
    return Miner.should.be.instanceof(nahmii.Wallet);
  });

  step('ClientFund contract', async () => {
    clientFundContract = await createContract('ClientFund', provider);
    return clientFundContract.should.be.instanceof(ethers.Contract);
  });

  step('NullSettlement contract', async () => {
    nullSettlementContract = await createContract('NullSettlement', provider);
    return nullSettlementContract.should.be.instanceof(ethers.Contract);
  });

  step('NullSettlementChallenge contract', async () => {
    nullSettlementChallengeContract = await createContract('NullSettlementChallenge', provider);
    return nullSettlementChallengeContract.should.be.instanceof(ethers.Contract);
  });

  step('DriipSettlement contract', async () => {
    driipSettlementContract = await createContract('DriipSettlement', provider);
    return driipSettlementContract.should.be.instanceof(ethers.Contract);
  });

  step('DriipSettlementChallenge contract', async () => {
    driipSettlementChallengeContract = await createContract('DriipSettlementChallenge', provider);
    return driipSettlementChallengeContract.should.be.instanceof(ethers.Contract);
  });

  step('Currency ETH', async () => {
    eth = await minikube.getCurrency('ETH');
    return eth.should.have.property('symbol', 'ETH');
  });
});

function createRandomWallet (ctx, walletName) {
  step(`${walletName} has new wallet`, () => {
    ctx[walletName] = new nahmii.Wallet(ethers.Wallet.createRandom().privateKey, provider);
    ctx[walletName].should.be.instanceof(nahmii.Wallet);
    ctx[walletName].purse = {};
  });

  step(`${walletName} has empty block chain balance`, async function () {
    const balance = await ctx[walletName].getBalance();
    balance.should.not.be.undefined.and.not.be.instanceof(Error);
    balance.toString().should.equal('0');
  });

  step(`${walletName} gets ETH from Faucet`, async () => {
    await Faucet.sendTransaction({
      to: ctx[walletName].address, value: parseEther('1.0'), gasLimit: 6000000
    });

    mineOneBlock(Miner);
  });

  step(`${walletName} has ETH in block chain balance`, async () => {
    const purse = ctx[walletName].purse;
    const balance = await ctx[walletName].getBalance();
    purse.initialBalance = balance;

    balance.should.not.be.undefined.and.not.be.instanceof(Error);
    formatEther(purse.initialBalance).should.equal('1.0');
  });

  step(`${walletName} has empty Nahmii balance`, async () => {
    const purse = ctx[walletName].purse;
    const balance = await ctx[walletName].getNahmiiBalance();
    balance.should.not.be.undefined.and.not.be.instanceof(Error);

    purse.initialNahmiiBalance = { ETH: '0.0', HBT: '0.0', NII: '0.0', ...balance };
    purse.initialNahmiiBalance.ETH.should.equal('0.0');
    purse.initialNahmiiBalance.HBT.should.equal('0.0');
    purse.initialNahmiiBalance.NII.should.equal('0.0');
  });
}

function isRevertContractException(error) {
  return error.code === 'CALL_EXCEPTION' || error.code === -32000;
}

function makeDeposit(ctx, walletName, depositEth) {

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

  step(`${walletName} deposits small amount`, async () => {
    const purse = ctx[walletName].purse;

    purse.depositedEth = parseEther(depositEth);
    purse.transaction = await ctx[walletName].depositEth(depositEth, { gasLimit: 2000000 });

    return purse.transaction.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step(`${walletName} receives transaction confirmation`, async () => {
    const purse = ctx[walletName].purse;

    purse.receipt = await provider.getTransactionConfirmation(purse.transaction.hash);
    return purse.receipt.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Deposit event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    ctx.nextDepositPromise.should.eventually.be.fulfilled;
  });

  step(`${walletName} has an updated block chain balance`, async () => {
    const purse = ctx[walletName].purse;

    purse.finalBalance = await ctx[walletName].getBalance();
    purse.finalBalance.should.not.be.undefined.and.not.be.instanceof(Error);

    const balanceDiff = purse.initialBalance.sub(purse.finalBalance);
    const balanceOut = purse.depositedEth.add(purse.receipt.gasUsed.mul('1000000000'));
    balanceDiff.gte(balanceOut).should.be.true;
  });

  step(`${walletName} has updated nahmii balance`, async () => {
    let nahmiiBalance;
    const purse = ctx[walletName].purse;

    await mineUntil(Miner, async () => {
      nahmiiBalance = await ctx[walletName].getNahmiiBalance();
      const result = nahmiiBalance && ((nahmiiBalance.ETH || '0.0') !== purse.initialNahmiiBalance.ETH);
      return result;
    }, 200, 100);

    nahmiiBalance.should.have.property('ETH');

    purse.finalNahmiiBalance = nahmiiBalance;

    const nahmiiBalanceIn = parseEther(purse.initialNahmiiBalance.ETH);
    const nahmiiBalanceOut = parseEther(purse.finalNahmiiBalance.ETH);
    const nahmiiBalanceDiff = nahmiiBalanceOut.sub(nahmiiBalanceIn);

    console.log('Nahmii balance in: ' + purse.initialNahmiiBalance.ETH);
    console.log('Nahmii balance out: ' + purse.finalNahmiiBalance.ETH);
    console.log('Nahmii balance diff: ' + formatEther(nahmiiBalanceDiff));

    formatEther(purse.depositedEth).should.equal(formatEther(nahmiiBalanceDiff));
  });
}

function initiateNullSettlementChallenge(ctx, walletName, stageAmount) {

  step('Alice has no proposal status', done => {
    nullSettlementChallengeContract.proposalStatus(ctx[walletName].address, eth.currency, 0)
    .then(res => done(res))
    .catch(err => isRevertContractException(err) ? done() : done(err));
  });

  step('Create challenge listener', async () => {
    ctx.nextStartChallengePromise = new Promise(resolve => {
      nullSettlementChallengeContract.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });

  step('Alice starts challenge process', async () => {
    const purse = ctx[walletName].purse;
    const settlement = new nahmii.Settlement(provider);
    purse.stagedAmount = new nahmii.MonetaryAmount(parseEther(stageAmount), eth.currency, 0);

    const txs = await settlement.startChallenge(purse.stagedAmount, ctx[walletName]);

    txs.length.should.equal(1);
    txs[0].type.should.equal('null');
  });

  step('Alice has proposal status "Qualified"', done => {
    nullSettlementChallengeContract.proposalStatus(ctx[walletName].address, eth.currency, 0)
    .then(res => (res === 0) ? done() : done(res))
    .catch(err => done(err));
  });

  step('Alice has valid staged amount', async () => {
    const proposalStageAmount = await nullSettlementChallengeContract.proposalStageAmount(ctx[walletName].address, eth.currency, 0);
    formatEther(proposalStageAmount).should.equal(stageAmount);
  });

  step('StartChallenge event is emitted', async function () {
    // Do not force mining before this test. Ganache will wipe the event !!!
    this.timeout(5000);
    ctx.nextStartChallengePromise.should.eventually.be.fulfilled;
  });

  step('StartChallenge event is valid', async function () {
    const { initiatorWallet, stagedAmount, stagedCt, stageId } = await ctx.nextStartChallengePromise;
    initiatorWallet.should.equal(ctx[walletName].address);
    formatEther(stagedAmount).should.equal(stageAmount);
    stagedCt.should.equal(eth.currency);
    stageId.toString().should.equal('0');
  });
}

function withdrawNullSettlementChallenge(ctx, walletName) {
}

describe('Qualified null settlement challenge', () => {
  const ctx = {};

  describe('A. Given user actor Alice', () => {
    createRandomWallet(ctx, 'Alice');
  });

  describe('B. When Alice deposits into nahmii', () => {
    makeDeposit(ctx, 'Alice', '0.002');
  });

  describe('C. When Alice stages null settlement', () => {
    initiateNullSettlementChallenge(ctx, 'Alice', '0.002');
  });

  describe('D. When Alice withdraws qualified null settlement', () => {
    withdrawNullSettlementChallenge(ctx, 'Alice');
  });
});
