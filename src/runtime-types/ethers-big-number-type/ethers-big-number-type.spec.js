/* eslint-disable no-unused-expressions */
'use strict';

const { bigNumberify, BigNumber } = require('ethers').utils;
const t = require('./ethers-big-number-type');

const chai = require('chai');
const expect = chai.expect;

const given = describe;
const when = describe;

describe('ethers-big-number-type', () => {
  given ('an EthersBigNumber type', () => {

    when ('validating', () => {
      it ('succeeds if input is an EthersBigNumber', () => {
        expect(t.EthersBigNumber().assert(bigNumberify(0))).to.be.instanceOf(BigNumber);
      });
      it ('throws if input is not an EthersBigNumber', () => {
        expect(() => t.EthersBigNumber().assert({})).to.throw(/Value must be an ethers BigNumber/);
      });
    });
  });
});
