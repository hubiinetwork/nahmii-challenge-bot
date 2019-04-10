'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const fs = require('fs');
const NestedError = require('./../utils/nested-error');

const { getWalletReceipts, getWalletReceiptFromNonce, getResentSenderReceipts } = require('./receipts-provider');

const eawJson = fs.readFileSync('./src/challenge-handler/receipts.spec.data.json', 'utf8');
const receipts = JSON.parse(eawJson);
const sender = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
const recipient = '0xcaf8bf7c0aab416dde4fe3c20c173e92afff8d72';
const ct = '0x0000000000000000000000000000000000000000';

const provider = {
  getWalletReceipts: sinon.stub() // (address, null, 100)
};

describe('receipts-provider', () => {
  describe('Can receive receipts from wallet', () => {
    it('Found when exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getWalletReceipts(provider, sender);
      return expect(res).to.eventually.have.property('length').equal(3);
    });

    it('Handles no receipts', async () => {
      provider.getWalletReceipts.returns([]);
      const res = getWalletReceipts(provider, sender);
      return expect(res).to.eventually.have.property('length').equal(0);
    });

    it('Throws when upstream throws', async () => {
      provider.getWalletReceipts.throws(new Error('ouch'));
      const res = getWalletReceipts(provider, sender);
      return expect(res).to.eventually.be.rejectedWith(NestedError);
    });
  });

  describe('Can receive receipt from nonce', () => {
    it('Found when sender nonce exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = 3;
      const res = getWalletReceiptFromNonce(provider, sender, nonce);
      return expect(res).to.eventually.have.property('sender').property('nonce').equal(nonce);
    });

    it('Throws when sender nonce does not exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = 4;
      const res = getWalletReceiptFromNonce(provider, sender, nonce);
      return expect(res).to.eventually.be.rejectedWith('No receipts for address');
    });

    it('Found when recipient nonce exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = 4;
      const res = getWalletReceiptFromNonce(provider, recipient, nonce);
      return expect(res).to.eventually.have.property('recipient').property('nonce').equal(nonce);
    });

    it('Throws when recipient nonce does not exists', async () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = 5;
      const res = getWalletReceiptFromNonce(provider, recipient, nonce);
      return expect(res).to.eventually.be.rejectedWith('No receipts for address');
    });
  });

  describe('Can receive recent receipts', () => {
    it('By block number', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getResentSenderReceipts(provider, sender, ct, 0, 0, 853);
      return expect(res).to.eventually.have.property('length').equal(2);
    });

    it('By sender nounce', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getResentSenderReceipts(provider, sender, ct, 0, 3, 0);
      return expect(res).to.eventually.have.property('length').equal(1);
    });

    it('Handles no receipts', async () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getResentSenderReceipts(provider, sender, ct, 0, 6, 0);
      return expect(res).to.eventually.have.property('length').equal(0);
    });
  });
});
