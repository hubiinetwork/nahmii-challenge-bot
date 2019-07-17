'use strict';

const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

const HttpError = require('./http-error');

describe('HttpError', () => {
  const code = '404';
  const message = 'some error message';
  let error;

  beforeEach(() => {
    try {
      throw new HttpError(code, message);
    } catch (err) {
      error = err;
    }
  });

  it('has code property', () => {
    expect(error.code).to.equal(code);
  });

  it('has message property', () => {
    expect(error.message).to.equal(message);
  });

  it('has stack property', () => {
    expect(error.stack).to.exist;
  });
});
