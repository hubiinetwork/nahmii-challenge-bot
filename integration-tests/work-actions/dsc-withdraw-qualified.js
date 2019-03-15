'use strict';

const chai = require('chai');
const expect = chai.expect;

module.exports = (ctx) => {
  step('not implemented', () => {
    expect(false).to.be.true;
  });
};