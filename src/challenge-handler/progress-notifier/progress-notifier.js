
'use strict';

const { logger } = require('@hubiinetwork/logger');

const _callbacks = new WeakMap;

function logReceipt (verdict, receipt, targetBalance) {
  logger.info(`    ${verdict} by payment at block ${receipt.blockNumber}`);
  logger.info(`    Sender   : address '${receipt.sender.wallet}', nonce '${receipt.sender.nonce}', balance '${receipt.sender.balances.current}', tau '${targetBalance}'`);
  logger.info(`    Recipient: address '${receipt.recipient.wallet}', nonce '${receipt.recipient.nonce}'`);
  logger.info(' ');
}

class ProgressNotifyer {

  constructor () {
    _callbacks.set(this, {
      onDCStart: null, onDSCAgreed: null, onDSCDisputed: null,
      onNCStart: null, onNSCAgreed: null, onNSCDisputed: null,
      onWalletLocked: null, onBalancesSeized: null
    });
  }

  updateCallback(callbackName, callback) {
    _callbacks.get(this)[callbackName] = callback;
  }

  notifyCallback (callbackName, ...params) {
    const callback = _callbacks.get(this)[callbackName];

    if (callback)
      callback(...params);
  }

  notifyDSCStart (initiator, nonce, stagedAmount) {
    logger.info(`Start DSC event: initiator ${initiator}, staged ${stagedAmount}, nonce ${nonce}`);
    this.notifyCallback('onDSCStart', initiator, nonce, stagedAmount);
  }

  notifyDSCAgreed (sender, receipt, targetBalance) {
    logReceipt('DSC Agreed', receipt, targetBalance);
    this.notifyCallback('onDSCAgreed', sender, receipt, targetBalance);
  }

  notifyDSCDisputed (sender, receipt, targetBalance) {
    logReceipt('DSC Disputed', receipt, targetBalance);
    this.notifyCallback('onDSCDisputed', sender, receipt, targetBalance);
  }

  notifyNSCStart (initiator, stagedAmount, ct, id) {
    logger.info(`Start NSC event: initiator ${initiator}, staged ${stagedAmount}, ct ${ct}, id ${id}`);
    this.notifyCallback('onNSCStart', initiator, stagedAmount, ct, id);
  }

  notifyNSCAgreed (sender) {
    logger.info('    NSC Agreed without payment');
    logger.info(`    Sender   : address '${sender}'`);
    logger.info(' ');
    this.notifyCallback('onNSCAgreed', sender);
  }

  notifyNSCDisputed (initiatorAddress, receipt, targetBalance) {
    logReceipt('NSC Disputed', receipt, targetBalance);
    this.notifyCallback('onNSCDisputed', initiatorAddress, receipt, targetBalance);
  }

  notifyWalletLocked (caption, challenger, lockedWallet, ct, id) {
    logger.info(`${caption} challenger ${challenger}, sender ${lockedWallet}, ct ${ct}, id ${id}`);
    this.notifyCallback('onWalletLocked', challenger, lockedWallet, ct, id);
  }

  notifyBalancesSeized (wallet, nonce, candidateHash, challenger) {
    logger.info('    Balance seized');
    logger.info(`    Sender   : address '${wallet}'`);
    logger.info(' ');
    this.notifyCallback('onBalancesSeized', wallet, nonce, candidateHash, challenger);
  }

  onDSCStart (callback) {
    this.updateCallback('onDSCStart', callback);
  }

  onDSCAgreed (callback) {
    this.updateCallback('onDSCAgreed', callback);
  }

  onDSCDisputed (callback) {
    this.updateCallback('onDSCDisputed', callback);
  }

  onNSCStart (callback) {
    this.updateCallback('onNSCStart', callback);
  }

  onNSCAgreed (callback) {
    this.updateCallback('onNSCAgreed', callback);
  }

  onNSCDisputed (callback) {
    this.updateCallback('onNSCDisputed', callback);
  }

  onWalletLocked (callback) {
    this.updateCallback('onWalletLocked', callback);
  }

  onBalancesSeized (callback) {
    this.updateCallback('onBalancesSeized', callback);
  }
}

module.exports = ProgressNotifyer;