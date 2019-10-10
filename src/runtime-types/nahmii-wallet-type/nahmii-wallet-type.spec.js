/* eslint-disable no-unused-expressions */
'use strict';

const nahmii = require('nahmii-sdk');
const t = require('./nahmii-wallet-type');

const chai = require('chai');
const expect = chai.expect;

const given = describe;
const when = describe;

describe('nahmii-wallet-type', () => {
  given ('an NahmiiWallet type', () => {

    when ('validating', () => {
      it ('succeeds if input is an NahmiiWallet', () => {
        const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
        expect(t.NahmiiWallet().assert(new nahmii.Wallet(privateKey))).to.be.instanceOf(nahmii.Wallet);
      });
      it ('throws if input is not an NahmiiWallet', () => {
        expect(() => t.NahmiiWallet().assert({})).to.throw(/Value must be an nahmii Wallet/);
      });
    });
  });
});
