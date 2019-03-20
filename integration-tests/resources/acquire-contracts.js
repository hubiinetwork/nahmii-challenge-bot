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
  const contractAddress = await getContractAddress(contractName);
  const code = await provider.getCode(contractAddress);

  if ((typeof code !=='string') || (code.length <= 10))
    return Promise.reject(new Error(`Contract ${contractName} ${contractAddress} is missing code.`));

  const abiPath = await getAbiPath(contractName);
  const deployment = require('../../' + abiPath);

  if (deployment.networks['3'].address !== contractAddress) {
    const msg = 'Contract addresses do not match.\n' +
    `        ${contractName}\n` +
    `        meta service : ${contractAddress}\n` +
    `        abi address  : ${deployment.address}`;
    throw new Error(msg);
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

  step('NullSettlementChallenge contract', async () => {
    ctx.contracts.nullSettlementChallenge = await createContract('NullSettlementChallenge', ctx.provider);
    expect(ctx.contracts.nullSettlementChallenge).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlement contract', async () => {
    ctx.contracts.driipSettlement = await createContract('DriipSettlement', ctx.provider);
    expect(ctx.contracts.driipSettlement).to.be.instanceof(ethers.Contract);
  });

  step('DriipSettlementChallenge contract', async () => {
    ctx.contracts.driipSettlementChallenge = await createContract('DriipSettlementChallenge', ctx.provider);
    expect(ctx.contracts.driipSettlementChallenge).to.be.instanceof(ethers.Contract);
  });
};
