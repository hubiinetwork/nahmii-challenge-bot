'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const ethers = require('ethers');

const minikube = require('../utils/minikube');
const config = require('../../src/config');
config.services.baseUrl = minikube.baseUrl;
config.identity.appId = minikube.appId;
config.identity.appSecret = minikube.appSecret;
config.ethereum.nodeUrl = minikube.nodeUrl;

const contracts = require('../../src/challenge-handler/contract-repository');

async function acquireContract (ctx, contractName) {
  const contract = await contracts.acquireContract(contractName);
  expect(contract).to.be.instanceof(ethers.Contract);
  expect(await contract.validate()).to.be.true;
  const code = await ctx.provider.getCode(contract.address);
  expect(code.length).to.be.gt(10);
  return contract;
}

module.exports = function (ctx) {
  step('ClientFund contract', async () => {
    ctx.contracts.clientFund = await acquireContract(ctx, 'ClientFund');
  });

  step('NullSettlement contract', async () => {
    ctx.contracts.nullSettlement = await acquireContract(ctx, 'NullSettlement');
  });

  step('NullSettlementChallengeByPayment contract', async () => {
    ctx.contracts.nullSettlementChallengeByPayment = await acquireContract(ctx, 'NullSettlementChallengeByPayment');
  });

  step('DriipSettlementByPayment contract', async () => {
    ctx.contracts.driipSettlementByPayment = await acquireContract(ctx, 'DriipSettlementByPayment');
  });

  step('DriipSettlementChallengeByPayment contract', async () => {
    ctx.contracts.driipSettlementChallengeByPayment = await acquireContract(ctx, 'DriipSettlementChallengeByPayment');
  });

  step('BalanceTracker contract', async () => {
    ctx.contracts.balanceTracker = await acquireContract(ctx, 'BalanceTracker');
  });

  step('DriipSettlementDisputeByPayment contract', async () => {
    ctx.contracts.driipSettlementDisputeByPayment = await acquireContract(ctx, 'DriipSettlementDisputeByPayment');
  });

  step('NullSettlementDisputeByPayment contract', async () => {
    ctx.contracts.nullSettlementDisputeByPayment = await acquireContract(ctx, 'NullSettlementDisputeByPayment');
  });

  async function aquireTokenContract (symbol, spec) {
    const addr = spec.networks[3].address;
    const curr = await minikube.getCurrency(symbol);
    expect(addr).to.equal(curr.ct);
    return new ethers.Contract(spec.networks[3].address, spec.abi, ctx.provider);
  }

  step('T18 contract', async () => {
    ctx.contracts.T18 = await aquireTokenContract('T18', require('../utils/T18.json'));
  });

  step('T15 contract', async () => {
    ctx.contracts.T15 = await aquireTokenContract('T15', require('../utils/T15.json'));
  });
};