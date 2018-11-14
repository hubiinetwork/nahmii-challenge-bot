'use strict';

const cliParser = require('./cli-parser');

const chai = require('chai');
const expect = chai.expect;

describe('cli-parser', () => {
  before(function () {
  });
  it(`recognizes no arguments`, function () {
    const argv = cliParser.parse([ '' ]);
    expect(argv).to.deep.include({
      Help: false
    });
  });
  it(`recognizes '-H'`, function () {
    const argv = cliParser.parse([ '-H' ]);
    expect(argv).to.deep.include({
      Help: true
    });
  });
});
