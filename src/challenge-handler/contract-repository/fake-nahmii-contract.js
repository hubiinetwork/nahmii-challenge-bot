'use strict';

const sinon = require('sinon');

class FakeNahmiiContract {
  constructor (contractName, _provider) {
    this.contractName = contractName;
    this.callbacks = {};

    switch (contractName) {

    case 'UnknownContract':
      throw new Error('Failed to construct an unknown contract');

    case 'InvalidContract':
      sinon.stub(this, 'validate').returns(false);
      break;

    case 'ClientFund':
      this.seizeBalances = sinon.stub();
      this.signer = { address: '0xdeadfeeddeadfeeddeadfeeddeadfeeddeadfeed' };
      break;

    case 'DriipSettlementChallengeByPayment':
      this.challengeByPayment = sinon.stub().resolves('OK');
      this.emitStartChallengeFromPaymentEvent = function (...args) {
        this.emit('StartChallengeFromPaymentEvent', ...args);
      };
      this.emitChallengeByPaymentEvent = function (...args) {
        this.emit('ChallengeByPaymentEvent', ...args);
      };
      break;

    case 'NullSettlementChallengeByPayment':
      this.challengeByPayment = sinon.stub().resolves('OK');
      this.emitStartChallengeEvent = function (...args) {
        this.emit('StartChallengeEvent', ...args);
      };
      this.emitChallengeByPaymentEvent = function (...args) {
        this.emit('ChallengeByPaymentEvent', ...args);
      };
      break;

    case 'BalanceTracker':
      this.activeBalanceTypes = sinon.stub();
      this.get = sinon.stub();
      this.fungibleRecordByBlockNumber = sinon.stub();
      break;
    }
  }

  on (eventName, cb) {
    this.callbacks[eventName] = cb;
  }

  emit (eventName, ...args) {
    if (this.callbacks[eventName])
      this.callbacks[eventName](...args);
    else
      throw new Error (`Contract ${this.contractName} failed to emit event for unknown event name ${eventName}`);
  }

  connect () {
    return this;
  }

  validate () {
    return true;
  }
}

module.exports = FakeNahmiiContract;
