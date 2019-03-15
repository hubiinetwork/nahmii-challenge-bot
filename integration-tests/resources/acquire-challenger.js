'use strict';

const chai = require('chai');
const nahmii = require('nahmii-sdk');
const ethers = require('ethers');

/* Challenger BEGIN impl *****************************************************/

const _wallet = new WeakMap;

const _driipSettelementChallengeCallback = new WeakMap;
const _nullSettelementChallengeCallback = new WeakMap;

const _driipSettlementChallengeContract = new WeakMap;
const _nullSettlementChallengeContract= new WeakMap;

class Challenger {

  constructor(wallet, driipSettlementChallengeContract, nullSettlementChallengeContract) {
    if (! (wallet instanceof nahmii.Wallet))
      throw TypeError('wallet argument is not an instance of nahmii.Wallet.');

    // ISSUE: Some nodes (e.g. ganache) is pecky about address format in filters.
    //        https://github.com/ethers-io/ethers.js/issues/165
    //        https://github.com/trufflesuite/ganache-cli/issues/494

    _wallet.set(this, wallet);
    _driipSettlementChallengeContract.set(this, driipSettlementChallengeContract);
    _nullSettlementChallengeContract.set(this, nullSettlementChallengeContract);

    //nullSettlementChallengeContract.on('StartChallengeEvent', (operatorWallet, amount, ct, id) => {
    //  handleStartChallengeEvent(this, operatorWallet, amount, ct, id);
    //});

    //processNewBlocks(this, undefined);
  }

  async handleDriipSettlementChallenge (initiatorWallet, paymentHash, stagedAmount) {
    if (_driipSettelementChallengeCallback)
      _driipSettelementChallengeCallback(initiatorWallet, paymentHash, stagedAmount);

    const initiatorReceipts = await _wallet.get(this).provider.getWalletReceipts(initiatorWallet);
    const initiatorReceipt = initiatorReceipts.find(receipt => receipt.seals.operator.hash === paymentHash);
    console.log('XXXXXX');
  }

  async handleNullSettlementChallenge (initiatorWallet, stagedAmount, ct, id) {
    if (_nullSettelementChallengeCallback.get(this))
      _nullSettelementChallengeCallback.get(this)(initiatorWallet, stagedAmount, ct, id);
  }

  onDriipSettlementChallenge (callback) {
    _driipSettelementChallengeCallback.set(this, callback);
  }

  onNullSettlementChallenge (callback) {
    _nullSettelementChallengeCallback.set(this, callback);
  }
}

/* Challenger END impl *******************************************************/

module.exports = function (ctx, walletName, assignedEth) {

  require('./acquire-actor')(ctx, walletName, assignedEth);

  step(`${walletName} takes role as challenger`, () => {
    chai.expect(ctx.wallets[walletName]).to.be.instanceof(nahmii.Wallet);
    ctx.wallets[walletName].asChallenger = new Challenger(
      ctx.wallets[walletName], ctx.contracts.driipSettlementChallenge, ctx.contracts.nullSettlementChallenge
    );
    chai.expect(ctx.wallets[walletName].asChallenger).to.be.instanceof(Challenger);
  });
  step(`${walletName} listenes to StartChallengeFromPaymentEvent`, () => {
    ctx.contracts.driipSettlementChallenge.on('StartChallengeFromPaymentEvent', (initiatorWallet, paymentHash, stagedAmount) => {
      ctx.wallets[walletName].asChallenger.handleDriipSettlementChallenge(initiatorWallet, paymentHash, stagedAmount);
    });
  });
  step(`${walletName} listenes to StartChallengeFromPaymentByProxyEvent`, () => {
    ctx.contracts.driipSettlementChallenge.on('StartChallengeFromPaymentByProxyEvent', (_proxy, initiatorWallet, paymentHash, stagedAmount) => {
      ctx.wallets[walletName].asChallenger.handleDriipSettlementChallenge(initiatorWallet, paymentHash, stagedAmount);
    });
  });
  step(`${walletName} listenes to StartChallengeEvent`, () => {
    ctx.contracts.nullSettlementChallenge.on('StartChallengeEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
      ctx.wallets[walletName].asChallenger.handleNullSettlementChallenge(initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  });
  step(`${walletName} listenes to StartChallengeByProxyEvent`, () => {
    ctx.contracts.nullSettlementChallenge.on('StartChallengeByProxyEvent', (_proxy, initiatorWallet, stagedAmount, stagedCt, stageId) => {
      ctx.wallets[walletName].asChallenger.handleNullSettlementChallenge(initiatorWallet, stagedAmount, stagedCt, stageId);
    });
  });
};
