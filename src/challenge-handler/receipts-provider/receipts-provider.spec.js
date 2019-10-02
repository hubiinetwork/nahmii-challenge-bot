'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
const NestedError = require('./../../utils/nested-error');
const ethers = require('ethers');
const { bigNumberify } = ethers.utils;

const expect = chai.expect;
const given = describe;
const when = describe;

const { getWalletReceipts, getWalletReceiptFromNonce, getRecentWalletReceipts } = require('./receipts-provider');

const receipts = require('./receipts.spec.data.json');
const sender = '0x54a27640b402cb7ca097c31cbf57ff23ea417026';
const recipient = '0xcaf8bf7c0aab416dde4fe3c20c173e92afff8d72';
const ct = '0x0000000000000000000000000000000000000000';

const provider = {
  getWalletReceipts: sinon.stub() // (address, null, 100)
};

describe('receipts-provider', () => {
  describe('Can receive receipts from wallet', () => {
    it('Found when exists', () => {
      provider.getWalletReceipts.returns(receipts);
      const res = getWalletReceipts(provider, sender);
      return expect(res).to.eventually.have.property('length').equal(3);
    });

    it('Handles no receipts', () => {
      provider.getWalletReceipts.returns([]);
      const res = getWalletReceipts(provider, sender);
      return expect(res).to.eventually.have.property('length').equal(0);
    });

    it('Throws when upstream throws', () => {
      provider.getWalletReceipts.throws(new Error('ouch'));
      const res = getWalletReceipts(provider, sender);
      return expect(res).to.eventually.be.rejectedWith(NestedError);
    });
  });

  describe('Can receive receipt from nonce', () => {
    it('Found when sender nonce exists', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(3);
      const res = getWalletReceiptFromNonce(provider, sender, nonce);
      return expect(res).to.eventually.have.property('sender').property('nonce').equal(nonce.toNumber());
    });

    it('Throws when sender nonce does not exists', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(40);
      const res = getWalletReceiptFromNonce(provider, sender, nonce);
      return expect(res).to.eventually.be.rejectedWith('Expected exactly one receipt for address 0x54a27640b402cb7ca097c31cbf57ff23ea417026 to match nonce 40');
    });

    it('Found when recipient nonce exists', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(4);
      const res = getWalletReceiptFromNonce(provider, recipient, nonce);
      return expect(res).to.eventually.have.property('recipient').property('nonce').equal(nonce.toNumber());
    });

    it('Throws when recipient nonce does not exists', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(5);
      const res = getWalletReceiptFromNonce(provider, recipient, nonce);
      return expect(res).to.eventually.be.rejectedWith('Expected exactly one receipt for address 0xcaf8bf7c0aab416dde4fe3c20c173e92afff8d72 to match nonce 5');
    });

    it('Fails when nonce is of wrong type', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = 4;
      const res = getWalletReceiptFromNonce(provider, recipient, nonce);
      return expect(res).to.eventually.be.rejectedWith('Expected nonce to be of type BigNumber');
    });
  });

  describe('Can receive recent receipts', () => {
    it('By block number', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(0);
      const res = getRecentWalletReceipts(provider, sender, ct, 0, nonce, 853);
      return expect(res).to.eventually.have.property('length').equal(2);
    });

    it('By sender nonce', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(3);
      const res = getRecentWalletReceipts(provider, sender, ct, 0, nonce, 0);
      return expect(res).to.eventually.have.property('length').equal(1);
    });

    it('By recipient nonce', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(3);
      const res = getRecentWalletReceipts(provider, recipient, ct, 0, nonce, 0);
      return expect(res).to.eventually.have.property('length').equal(2);
    });

    it('Handles no receipts', () => {
      provider.getWalletReceipts.returns(receipts);
      const nonce = bigNumberify(6);
      const res = getRecentWalletReceipts(provider, sender, ct, 0, nonce, 0);
      return expect(res).to.eventually.have.property('length').equal(0);
    });
  });

  given('a receipts provider', () => {
    when ('providing receipts for a wallet', () => {
      it ('adds the sender party if initiator is sender', async () => {
        const nonce = bigNumberify(0);
        const receipts = await getRecentWalletReceipts(provider, sender, ct, 0, nonce, 0);
        expect(receipts.length).to.equal(3);
        for (const receipt of receipts)
          expect(receipt.party.wallet).to.equal(sender);
      });

      it ('adds the recipient party if initiator is recipient', async () => {
        const nonce = bigNumberify(0);
        const receipts = await getRecentWalletReceipts(provider, recipient, ct, 0, nonce, 0);
        expect(receipts.length).to.equal(3);
        for (const receipt of receipts)
          expect(receipt.party.wallet).to.equal(recipient);
      });

      it ('throws if wallet does not have a party', () => {
        const nonce = bigNumberify(0);
        return expect(getRecentWalletReceipts(provider, ct, ct, 0, nonce, 0)).to.eventually.be.rejectedWith(/Wallet not party of receipt/);
      });

      it ('throws if nonce is of the wrong type', () => {
        return expect(getRecentWalletReceipts(provider, ct, ct, recipient, 0, 0)).to.eventually.be.rejectedWith(/Expected nonce to be of type BigNumber/);
      });
    });
  });
});
