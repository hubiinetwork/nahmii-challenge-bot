'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

const minikube = require('./minikube');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');

// Hack until we figure out how to make https protocol work
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

describe('Deposit', () => {
  let provider, wallet;
  let initialNahmiiBalance, initialEthBalance;
  let depositumEth, transaction, receipt;
  let finalNahmiiBalance, finalEthBalance;

  step('Acquire Nahmii provider', async () => {
    provider = new nahmii.NahmiiProvider(minikube.baseUrl, minikube.appId, minikube.appSecret, minikube.nodeUrl, 'ropsten');
    return provider.should.be.instanceof(nahmii.NahmiiProvider);
  });

  step('Acquire wallet', async () => {
    wallet = new nahmii.Wallet(minikube.accounts[0].privateKey, provider);
    return wallet.should.be.instanceof(nahmii.Wallet);
  });

  step('Get initial nahmii balance', async () => {
    initialNahmiiBalance = await wallet.getNahmiiBalance();
    return initialNahmiiBalance.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Get initial block chain balance', async () => {
    initialEthBalance = await wallet.getBalance();
    return initialEthBalance.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Deposit', async () => {
    depositumEth = '1.0';
    transaction = await wallet.depositEth(depositumEth, { gasLimit: 200000 });
    return transaction.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Get confirmation', async () => {
    receipt = await provider.getTransactionConfirmation(transaction.hash);
    return receipt.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Get final nahmii balance', async () => {
    finalNahmiiBalance = await wallet.getNahmiiBalance();
    return initialNahmiiBalance.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Get final block chain balance', async () => {
    finalEthBalance = await wallet.getBalance();
    return initialEthBalance.should.not.be.undefined.and.not.be.instanceof(Error);
  });

  step('Nahmii balance is updated', () => {
    const balanceDiff = initialEthBalance.sub(finalEthBalance);
    const balanceOut = ethers.utils.parseEther(depositumEth).add(receipt.gasUsed.mul('1000000000'));
    balanceDiff.gte(balanceOut).should.be.true;
  });
});
