/* eslint-disable no-unused-expressions */
'use strict';

const { EthereumAddress } = require('nahmii-ethereum-address');
const t = require('./address-string-type');

const chai = require('chai');
const expect = chai.expect;

const given = describe;
const when = describe;

describe('address-string-type', () => {
  given ('an address string', () => {
    const validAddresses = [
      '0x72497614636294A446454e2ac50d3195cc6893d1',
      '0x72497614636294a446454e2ac50d3195cc6893d1',
      '0x0011223344556677889900112233445566778899'
    ];
    const illegalAddresses = [
      '72497614636294a446454e2ac50d3195cc6893d1',
      {}
    ];

    when ('validating', () => {
      it ('succeeds if input is a valid address string', () => {
        for (const address of validAddresses)
          expect(t.AddressString().assert(address)).to.be.a('string');
      });
      it ('throws if input is not a valid address string', () => {
        for (const address of illegalAddresses)
          expect(() => t.AddressString().assert(address)).to.throw(/Value must be an address string/);
      });
    });
  });
});
