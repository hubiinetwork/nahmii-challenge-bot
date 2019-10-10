
'use strict';

const { logger } = require('@hubiinetwork/logger');
const t = require('../../runtime-types');

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
    t.EthereumAddress().assert(initiator);
    t.EthersBigNumber().assert(nonce);
    t.EthersBigNumber().assert(stagedAmount);

    logger.info(`Start DSC event: initiator ${initiator.toString()}, staged ${stagedAmount}, nonce ${nonce}`);
    this.notifyCallback('onDSCStart', initiator, nonce, stagedAmount);
  }

  notifyDSCAgreed (initiator) {
    t.EthereumAddress().assert(initiator);

    logger.info('    DSC Agreed');
    logger.info(`    Initiator: address '${initiator}'`);
    logger.info(' ');
    this.notifyCallback('onDSCAgreed', initiator);
  }

  notifyDSCDisputed (initiator, receipt, targetBalance) {
    t.EthereumAddress().assert(initiator);
    t.EthersBigNumber().assert(targetBalance);

    this.notifyCallback('onDSCDisputed', initiator, receipt, targetBalance);
  }

  notifyNSCStart (initiator, stagedAmount, ct, id) {
    t.EthereumAddress().assert(initiator);
    t.EthersBigNumber().assert(stagedAmount);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    logger.info(`Start NSC event: initiator ${initiator}, staged ${stagedAmount}, ct ${ct}, id ${id}`);
    this.notifyCallback('onNSCStart', initiator, stagedAmount, ct, id);
  }

  notifyNSCAgreed (initiator) {
    t.EthereumAddress().assert(initiator);

    logger.info('    NSC Agreed');
    logger.info(`    Sender   : address '${initiator}'`);
    logger.info(' ');
    this.notifyCallback('onNSCAgreed', initiator);
  }

  notifyNSCDisputed (initiator, receipt, targetBalance) {
    t.EthereumAddress().assert(initiator);
    t.EthersBigNumber().assert(targetBalance);

    this.notifyCallback('onNSCDisputed', initiator, receipt, targetBalance);
  }

  notifyWalletLocked (caption, challenger, initiator, ct, id) {
    t.string().assert(caption);
    t.EthereumAddress().assert(challenger);
    t.EthereumAddress().assert(initiator);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    logger.info(`${caption} challenger ${challenger}, sender ${initiator}, ct ${ct}, id ${id}`);
    this.notifyCallback('onWalletLocked', challenger, initiator, ct, id);
  }

  logBalancesSeized (initiator, challenger, amount, ct, id) {
    t.EthereumAddress().assert(challenger);
    t.EthereumAddress().assert(initiator);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    logger.info('Balance seized');
    logger.info(`    Challenger wallet: ${challenger}`);
    logger.info(`    Initiator wallet: '${initiator}`);
    logger.info(`    amount: '${amount}`);
    logger.info(`    ct: '${ct}`);
    logger.info(`    id: '${id.toString()}`);
    logger.info(' ');
  }

  notifyBalancesSeized (initiator, challenger, amount, ct, id) {
    t.EthereumAddress().assert(challenger);
    t.EthereumAddress().assert(initiator);
    t.EthereumAddress().assert(ct);
    t.EthersBigNumber().assert(id);

    this.logBalancesSeized(initiator, challenger, amount, ct, id);
    this.notifyCallback('onBalancesSeized', initiator, challenger, amount, ct, id);
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