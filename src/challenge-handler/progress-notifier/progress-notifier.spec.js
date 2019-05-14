'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const ethers = require('ethers');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('progress-notifier', () => {
  let notifier;

  const receipts = require('../receipts-provider/receipts.spec.data.json');
  const initiator = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
  const challenger = initiator;
  const lockedWallet = initiator;
  const ct = '0x0000000000000000000000000000000000000000';
  const id = 0;
  const nonce = 0;
  const stagedAmount = ethers.utils.bigNumberify(10);
  const targetBalance = stagedAmount;
  const amount = stagedAmount;


  beforeEach (() => {
    const loggerMock = { logger: { info: sinon.stub() }}
    const ProgressNotifyer = proxyquire('./progress-notifier', {
      '@hubiinetwork/logger': loggerMock
    });

    notifier = new ProgressNotifyer();
  });

  describe('Notifies callbacks', () => {

    it('#notifyDSCStart() notifies #onDSCStart()', function () {
      return expect(new Promise(resolve => {
        notifier.onDSCStart(resolve);
        notifier.notifyDSCStart(initiator, nonce, stagedAmount);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyDSCAgreed() notifies #onDSCAgreed()', function () {
      return expect(new Promise(resolve => {
        notifier.onDSCAgreed(resolve);
        notifier.notifyDSCAgreed(initiator, receipts[0], targetBalance);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyDSCDisputed() notifies #onDSCDisputed()', function () {
      return expect(new Promise(resolve => {
        notifier.onDSCDisputed(resolve);
        notifier.notifyDSCDisputed(initiator, receipts[0], targetBalance);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyNSCStart() notifies #onNSCStart()', function () {
      return expect(new Promise(resolve => {
        notifier.onNSCStart(resolve);
        notifier.notifyNSCStart(initiator, stagedAmount, ct, id);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyNSCAgreed() notifies #onNSCAgreed()', function () {
      return expect(new Promise(resolve => {
        notifier.onNSCAgreed(resolve);
        notifier.notifyNSCAgreed(initiator);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyNSCDisputed() notifies #onNSCDisputed()', function () {
      return expect(new Promise(resolve => {
        notifier.onNSCDisputed(resolve);
        notifier.notifyNSCDisputed(initiator, receipts[0], targetBalance);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyWalletLocked() notifies #onWalletLocked()', function () {
      return expect(new Promise(resolve => {
        notifier.onWalletLocked(resolve);
        notifier.notifyWalletLocked('caption', challenger, lockedWallet, ct, id);
      })).to.eventually.be.fulfilled;
    });

    it('#notifyBalancesSeized() notifies #onBalancesSeized()', function () {
      return expect(new Promise(resolve => {
        notifier.onBalancesSeized(resolve);
        notifier.notifyBalancesSeized('caption', challenger, challenger, lockedWallet, amount, ct, id);
      })).to.eventually.be.fulfilled;
    });

  });
});
