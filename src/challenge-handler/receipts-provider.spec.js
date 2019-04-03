'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs');
const NestedError = require('./../utils/nested-error');

const { getWalletReceipts, getWalletReceiptFromHash, getResentSenderReceipts } = require('./receipts-provider');

const eawJson = fs.readFileSync('./src/challenge-handler/receipts.spec.data.json', 'utf8');
const receipts = JSON.parse(eawJson);
const address = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
const hash = '0xa07f1b6aceb34c95792d22d309ef772f0c9064d02d1f4538954535b046ac76f8';
const ct = '0x0000000000000000000000000000000000000000';

const provider = {
  getWalletReceipts: sinon.stub() // (address, null, 100)
};

describe('receipts-provider', () => {
  describe('Can receive receipts from wallet', () => {
    it('Found when exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getWalletReceipts(provider, address);
      return expect(res).to.eventually.have.property('length').equal(3);
    });

    it('Handles no receipts', async () => {
      provider.getWalletReceipts.returns([]);
      const res = getWalletReceipts(provider, address);
      return expect(res).to.eventually.have.property('length').equal(0);
    });

    it('Throws when upstream throws', async () => {
      provider.getWalletReceipts.throws(new Error('ouch'));
      const res = getWalletReceipts(provider, address);
      return expect(res).to.eventually.be.rejectedWith(NestedError);
    });
  });

  describe('Can receive receipt from hash', () => {
    it('Found when exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getWalletReceiptFromHash(provider, address, hash);
      return expect(res).to.eventually.have.property('seals').property('operator').property('hash').equal(hash);
    });

    it('Throws when hash does not exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const hash = '0xaa7f1b6aceb34c95792d22d309ef772f0c9064d02d1f4538954535b046ac76f8';
      const res = getWalletReceiptFromHash(provider, address, hash);
      return expect(res).to.eventually.be.rejectedWith('No receipts for address');
    });
  });

  describe('Can receive recent receipts', () => {
    it('By block number', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getResentSenderReceipts(provider, address, ct, 0, 0, 853);
      return expect(res).to.eventually.have.property('length').equal(2);
    });

    it('By sender nounce', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getResentSenderReceipts(provider, address, ct, 0, 3, 0);
      return expect(res).to.eventually.have.property('length').equal(1);
    });

    it('Handles no receipts', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getResentSenderReceipts(provider, address, ct, 0, 6, 0);
      return expect(res).to.eventually.have.property('length').equal(0);
    });
  });
});
