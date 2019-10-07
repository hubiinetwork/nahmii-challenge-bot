/* eslint-disable no-unused-expressions */
'use strict';

const { EthereumAddress } = require('nahmii-ethereum-address');
const t = require('./ethereum-address-type');

const chai = require('chai');
const expect = chai.expect;

const given = describe;
const when = describe;

describe('ethereum-address-type', () => {
  given ('an EthereumAddress type description', () => {
    const ethereumAddress = EthereumAddress.from('0x0011223344556677889900112233445566778899');

    when ('validating', () => {
      it ('succeeds if input is an EthereumAddress', () => {
        expect(t.EthereumAddress().assert(ethereumAddress)).to.be.instanceOf(EthereumAddress);
      });
      it ('throws if input is not an EthereumAddress', () => {
        expect(() => t.EthereumAddress().assert({})).to.throw(/Value must be an EthereumAddress/);
      });
    });
  });
});
