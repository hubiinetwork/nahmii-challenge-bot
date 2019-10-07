/* eslint-disable no-unused-expressions */
'use strict';

const t = require('./uint-type');

const chai = require('chai');
const expect = chai.expect;

const given = describe;
const when = describe;

describe('type-checker', () => {
  given ('a uint validator', () => {
    when ('validating', () => {
      it ('succeeds if value is an uint', () => {
        expect(t.uint().assert(0)).to.equal(0);
        expect(t.uint().assert(1)).to.equal(1);
      });
      it ('throws if value is not an uint', () => {
        expect(() => t.uint().assert('')).to.throw(/Value must be a number/);
        expect(() => t.uint().assert(1.1)).to.throw(/Value must be an int/);
        expect(() => t.uint().assert(-1)).to.throw(/Value must be an uint/);
      });
    });
  });
});
