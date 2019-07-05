
'use strict';

const { logger } = require('@hubiinetwork/logger');

const _callbacks = new WeakMap;

class ProgressNotifier {

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

  notifyDSCAgreed (sender) {
    logger.info('    DSC Agreed without payment');
    logger.info(`    Sender   : address '${sender}'`);
    logger.info(' ');
    this.notifyCallback('onDSCAgreed', sender);
  }

  notifyDSCDisputed (sender, receipt, targetBalance) {
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
    this.notifyCallback('onNSCDisputed', initiatorAddress, receipt, targetBalance);
  }

  notifyWalletLocked (caption, challenger, lockedWallet, ct, id) {
    logger.info(`${caption} challenger ${challenger}, sender ${lockedWallet}, ct ${ct}, id ${id}`);
    this.notifyCallback('onWalletLocked', challenger, lockedWallet, ct, id);
  }

  logBalancesSeized (seizedWallet, seizerWallet, amount, ct, id) {
    logger.info('Balance seized');
    logger.info(`    Challenger wallet: ${seizerWallet}`);
    logger.info(`    Seized wallet: '${seizedWallet}`);
    logger.info(`    amount: '${amount}`);
    logger.info(`    ct: '${ct}`);
    logger.info(`    id: '${id.toString()}`);
    logger.info(' ');
  }

  notifyBalancesSeized (seizedWallet, seizerWallet, amount, ct, id) {
    this.logBalancesSeized(seizedWallet, seizerWallet, amount, ct, id);
    this.notifyCallback('onBalancesSeized', seizedWallet, seizerWallet, amount, ct, id);
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

module.exports = ProgressNotifier;