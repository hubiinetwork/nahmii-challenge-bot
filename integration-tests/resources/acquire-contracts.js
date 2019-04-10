'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const { execSync } = require('child_process');
const ethers = require('ethers');
const request = require('superagent');

const global = {};

async function getContractAddress (contractName) {
  if (! global.contracts) {
    const response = await request.get(`http://omphalos.mini.cluster`);
    global.contracts = response.body.ethereum.contracts;
  }

  return global.contracts[contractName];
}

function getAbiPath (contractName) {
  return new Promise((resolve, reject) =>{
    const abiPaths = execSync(
      `find ./node_modules/nahmii-contract-abstractions-ropsten/build/contracts -type f -name ${contractName}.json`,
      { encoding: 'utf8' }
    ).split('\n');

    if ((abiPaths.length < 1) || (abiPaths.length === 1 && abiPaths[0] === ''))
      reject(new Error('Could not find ABI of contract: ' + contractName));
    else
      resolve(abiPaths[0]);
  });
}

async function createContract (contractName, provider) {
  const contractAddress = await getContractAddress(contractName);
  const code = await provider.getCode(contractAddress);

  if ((typeof code !=='string') || (code.length <= 10))
    return Promise.reject(new Error(`Contract ${contractName} ${contractAddress} is missing code.`));

  const abiPath = await getAbiPath(contractName);
  const deployment = require('../../' + abiPath);

  console.log(contractName + ': ' + JSON.stringify(Object.keys(deployment)));

  if (deployment.networks[provider.network.chainId].address !== contractAddress) {
/*
    const msg = 'Contract addresses do not match.\n' +
    `        ${contractName}\n` +
    `        meta service : ${contractAddress}\n` +
    `        abi address  : ${deployment.networks['3'].address}`;
    throw new Error(msg);
*/
  }

  return new ethers.Contract(contractAddress, deployment.abi, provider);
}

module.exports = function (ctx) {
  step('ClientFund contract', async () => {
    ctx.contracts.clientFund = await createContract('ClientFund', ctx.provider);
    expect(ctx.contracts.clientFund).to.be.instanceof(ethers.Contract);
  });

  step('NullSettlement contract', async () => {
    ctx.contracts.nullSettlement = await createContract('NullSettlement', ctx.provider);
    expect(ctx.contracts.nullSettlement).to.be.instanceof(ethers.Contract);
  });

  step('NullSettlementChallengeByPayment contract', async () => {
    ctx.contracts.nullSettlementChallengeByPayment = await createContract('NullSettlementChallengeByPayment', ctx.provider);
    expect(ctx.contracts.nullSettlementChallengeByPayment).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlementByPayment contract', async () => {
    ctx.contracts.driipSettlementByPayment = await createContract('DriipSettlementByPayment', ctx.provider);
    expect(ctx.contracts.driipSettlementByPayment).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlementChallengeByPayment contract', async () => {
    ctx.contracts.driipSettlementChallengeByPayment = await createContract('DriipSettlementChallengeByPayment', ctx.provider);
    expect(ctx.contracts.driipSettlementChallengeByPayment).to.be.instanceof(ethers.Contract);
  });

  step('BalanceTracker contract', async () => {
    ctx.contracts.balanceTracker = await createContract('BalanceTracker', ctx.provider);
    expect(ctx.contracts.balanceTracker).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlementDisputeByPayment contract', async () => {
    ctx.contracts.driipSettlementDisputeByPayment = await createContract('DriipSettlementDisputeByPayment', ctx.provider);
    expect(ctx.contracts.driipSettlementDisputeByPayment).to.be.instanceof(ethers.Contract);
  });

  step('NullSettlementDisputeByPayment contract', async () => {
    ctx.contracts.nullSettlementDisputeByPayment = await createContract('NullSettlementDisputeByPayment', ctx.provider);
    expect(ctx.contracts.nullSettlementDisputeByPayment).to.be.instanceof(ethers.Contract);
  });
};
