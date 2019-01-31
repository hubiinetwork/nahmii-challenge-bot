'use strict';
/* eslint-disable no-unused-expressions */

const chai = Object.create(require('chai'));
chai.should();
const { given, req } = require('./gwt');
const NestedError = require('./nested-error');

function nestedErrorIsValid () {
  req('has message', (_, resulting) => {
    resulting.nestedErr.message.should.equal('Outer error');
  });
  req('has stack', (_, resulting) => {
    resulting.nestedErr.stack.should.exist;
  });
  req('has asStringified()', (_, resulting) => {
    resulting.nestedErr.asStringified.should.exist;
  });
  req('asStringified() returns outer message', (_, resulting) => {
    /Outer error/.test(resulting.nestedErr.asStringified()).should.be.true;
  });
  req('asStringified() returns inner message', (_, resulting) => {
    const x = resulting.nestedErr.asStringified();
    /Inner error/.test(resulting.nestedErr.asStringified()).should.be.true;
  });
  req('has static asStringified()', () => {
    NestedError.asStringified.should.exist;
  });
}

describe('NestedError construction', function () {
  given('an Error as inner error', () => ({
    innerErr: new Error('Inner error')
  }))
    .when('NestedError instance constructed', given => ({
      nestedErr: new NestedError(given.innerErr, 'Outer error')
    }))
    .then('is valid', () => {
      nestedErrorIsValid.call(this);

      req('has innerError', (_, resulting) => {
        resulting.nestedErr.innerError.should.exist;
      });
      req('has innerError.message', (_, resulting) => {
        resulting.nestedErr.innerError.message.should.equal('Inner error');
      });
      req('has innerError.stack', (_, resulting) => {
        resulting.nestedErr.innerError.stack.should.exist;
      });
    });

  given('a string as inner error', () => ({
    innerErr: 'Inner error'
  }))
    .when('NestedError instance constructed', given => ({
      nestedErr: new NestedError(given.innerErr, 'Outer error')
    }))
    .then('is valid', () => {
      nestedErrorIsValid.call(this);
    });
});
