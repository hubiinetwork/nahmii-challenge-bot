/* eslint-disable no-unused-expressions */
'use strict';

const { EthereumAddress } = require('nahmii-ethereum-address');
const ethers = require('ethers');

const chai = require('chai');
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

const expect = chai.expect;
const given = describe;
const when = describe;

const fakeContracts = {
  getDriipSettlementChallengeByPayment: sinon.stub(),
  getNullSettlementChallengeByPayment: sinon.stub()
};

class FakeProposal {
  constructor () {
    this.getProposalExpirationTime = sinon.stub().returns(Date.now());
  }
}

function getStubbedEventRepeater () {
  return proxyquire('./event-repeater', {
    '../../contract-repository': fakeContracts,
    '../proposal': FakeProposal
  });
}


describe('event-repeater', () => {
  const initiator = EthereumAddress.from('0x54a27640b402cb7ca097c31cbf57ff23ea417026');
  const nonce = ethers.utils.bigNumberify(11);
  const ct = EthereumAddress.from('0x0000000000000000000000000000000000000000');
  const id = ethers.utils.bigNumberify(0);
  const cumulativeTransferAmount = ethers.utils.bigNumberify(22);
  const stageAmount = ethers.utils.bigNumberify(33);
  const targetBalanceAmount = ethers.utils.bigNumberify(44);

  given ('an EventRepeater', () => {
    let EventRepeater, fakeCallback;

    beforeEach(() => {
      EventRepeater = getStubbedEventRepeater();
      fakeCallback = sinon.stub();
    });

    when ('receiving DSC event', () => {
      const values = [initiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id];
      const names = ['initiator', 'nonce', 'cumulativeTransferAmount', 'stageAmount', 'targetBalanceAmount', 'ct', 'id'];

      beforeEach(async () => {
        await EventRepeater.handleDSCStart(initiator, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, fakeCallback);
        await new Promise(resolve => setTimeout(resolve, 0)); // Delay to next tick
      });

      it ('calls callback twice', async () => {
        return expect(fakeCallback.calledTwice).to.be.true;
      });

      for (let i = 0; i < values.length; ++i) {
        it (`callback gets ${names[i]}`, () => {
          if (fakeCallback.args[0][i].isEqual === undefined) {
            expect(fakeCallback.args[0][i].eq(values[i])).to.be.true;
            expect(fakeCallback.args[1][i].eq(values[i])).to.be.true;
          }
          else {
            expect(fakeCallback.args[0][i].isEqual(values[i])).to.be.true;
            expect(fakeCallback.args[1][i].isEqual(values[i])).to.be.true;
          }
        });
      }

      for (let i = 0; i < values.length; ++i) {
        it (`fails if ${names[i]} argument is illegal`, () => {
          const value = (i, j) => i === j ? null : values[i];
          return expect(
            EventRepeater.handleDSCStart(value(i, 0), value(i, 1), value(i, 2), value(i, 3), value(i, 5), value(i, 6), value(i, 7), fakeCallback)
          ).to.eventually.be.rejected;
        });
      }
    });

    when ('receiving NSC event', () => {
      const values = [initiator, nonce, stageAmount, targetBalanceAmount, ct, id];
      const names = ['initiator', 'nonce', 'stageAmount', 'targetBalanceAmount', 'ct', 'id'];

      beforeEach(async () => {
        await EventRepeater.handleNSCStart(initiator, nonce, stageAmount, targetBalanceAmount, ct, id, fakeCallback);
        await new Promise(resolve => setTimeout(resolve, 0)); // Delay to next tick
      });

      it ('calls callback twice', async () => {
        return expect(fakeCallback.calledTwice).to.be.true;
      });

      for (let i = 0; i < values.length; ++i) {
        it (`callback gets ${names[i]}`, () => {
          if (fakeCallback.args[0][i].isEqual === undefined) {
            expect(fakeCallback.args[0][i].eq(values[i])).to.be.true;
            expect(fakeCallback.args[1][i].eq(values[i])).to.be.true;
          }
          else {
            expect(fakeCallback.args[0][i].isEqual(values[i])).to.be.true;
            expect(fakeCallback.args[1][i].isEqual(values[i])).to.be.true;
          }
        });
      }

      for (let i = 0; i < values.length; ++i) {
        it (`fails if ${names[i]} argument is illegal`, () => {
          const value = (i, j) => i === j ? null : values[i];
          return expect(
            EventRepeater.handleNSCStart(value(i, 0), value(i, 1), value(i, 2), value(i, 3), value(i, 5), value(i, 6), fakeCallback)
          ).to.eventually.be.rejected;
        });
      }
    });
  });
});
