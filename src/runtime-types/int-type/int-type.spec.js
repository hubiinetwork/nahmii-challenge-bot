/* eslint-disable no-unused-expressions */
'use strict';

const t = require('./int-type');

const chai = require('chai');
const expect = chai.expect;

const given = describe;
const when = describe;

describe('type-checker', () => {
  given ('a int validator', () => {
    when ('validating', () => {
      it ('succeeds if value is an int', () => {
        expect(t.int().assert(-1)).to.equal(-1);
        expect(t.int().assert(0)).to.equal(0);
        expect(t.int().assert(1)).to.equal(1);
      });
      it ('throws if value is not an int', () => {
        expect(() => t.int().assert('')).to.throw(/Value must be a number/);
        expect(() => t.int().assert(1.1)).to.throw(/Value must be an int/);
      });
    });
  });
});
