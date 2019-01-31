'use strict';
/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */

const { expect } = require('chai');
const { given, req } = require('./gwt3');

function testcaseSetupIsAccessible () {
  req('accessible precondition', (given, resulting) => {
    expect(given.s1.length).to.be.eql(given.len1);
  });
  req('accessible result', (given, resulting) => {
    expect(resulting.s2.length).to.be.equal(2 * given.len1);
  });
}

describe('gwt3 general testcase', function () {
  given('a precondition as input', () => {
    const s1 = 'my object';
    return {
      s1: 'my object',
      len1: s1.length
    };
  })
    .when('a result from applied action', given => ({
      s2: given.s1 + given.s1
    }))
    .then('are accessible for verification', () => {
      testcaseSetupIsAccessible.call(this);
    })
    .when('a result from another applied action', given => ({
      s3: given.s1 + given.s1
    }))
    .then('are accessible for verification', () => {
      req('accessible precondition', (given, resulting) => {
        expect(given.s1.length).to.be.eql(given.len1);
      });
      req('accessible result', (given, resulting) => {
        expect(resulting.s3.length).to.be.equal(2 * given.len1);
      });
    });
});
