'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const minikube = require('./minikube');
const nahmii = require('nahmii-sdk');
const io = require('socket.io-client');
const ethers = require('ethers');
const { formatEther, parseEther } = ethers.utils;

// Hack until we figure out how to make https protocol work
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

async function createContract (contractName, provider) {
  const { abi } = require(`../src/contract-factory/abi/${contractName}.json`);
  const contractAddress = await minikube.getContractAddress(contractName);
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

function promiseNextDepositFromEvent() {
  return new Promise(resolve => {
    clientFundContract.once('ReceiveEvent', (wallet, balanceType, value, currencyCt, currencyId, standard) => {
      resolve({ wallet, balanceType, value, currencyCt, currencyId, standard });
    });
  });
}

// Resources
let provider, Faucet, Miner, Alice, Bob, Charles;
let clientFundContract;
let eth;

describe('Acquire resources', () => {
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

  step('ClientFund contract accessible', async () => {
    const contractAddress = await minikube.getContractAddress('ClientFund');
    const code = await provider.getCode(contractAddress);
    (typeof code).should.be.equal('string');
    code.length.should.be.gt(2);
    return true;
  });

  step('ClientFund contract create', async () => {
    clientFundContract = await createContract('ClientFund', provider);
    return true;
  });

  step('Get currency eth', async () => {
    eth = await minikube.getCurrency('ETH');
    return eth.should.have.property('symbol', 'ETH');
  });

  step('Ensure initial block-chain confirmation cover', async () => {
    return mineOneBlock(Miner).should.eventually.be.fulfilled;
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

function makeDeposit(ctx, walletName, depositEth) {

  step('Create deposit listener', async () => {
    ctx.nextDepositPromise = promiseNextDepositFromEvent();
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

  xstep('Deposit event is emitted', async function () {
    // Must be done before any 'evm_mine' since that vaporizes events
    this.timeout(5000);
    return Promise.race([
      ctx.nextDepositPromise,
      mineUntil(Miner, () => false, 200, 100)
    ]).should.eventually.be.fulfilled;
  });

  step(`${walletName} has updated block chain balance`, async () => {
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

describe('Successful null settlement', () => {
  const ctx = {};

  describe('0) Create actor Alice', () => {
    createRandomWallet(ctx, 'Alice');
  });

  describe('2) Deposit phase', () => {
    makeDeposit(ctx, 'Alice', '0.002');
  });

  describe('3) Challenge phase', () => {
    step('Alice\'s proposal status should be null', async () => {
      const driipSettlementChallengeContract = new nahmii.DriipSettlementChallenge(provider);
      const status = driipSettlementChallengeContract.getCurrentProposalStatus(ctx.Alice.address, eth.currency, 0);
      return chai.expect(status).to.eventually.equal(null);
    });

    step('Alice starts challenge', async () => {
      const settlement = new nahmii.Settlement(provider);
      const stageAmount = new nahmii.MonetaryAmount(ctx.Alice.purse.depositedEth, eth.currency, 0);
      const txs = await settlement.startChallenge(stageAmount, ctx.Alice);
      txs.length.should.equal(1);
      txs[0].type.should.equal('null');
    });
  });
});
