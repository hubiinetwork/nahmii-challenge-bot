'use strict';

const cliParser = require('./cli-parser');

const chai = require('chai');
const expect = chai.expect;

describe('cli-parser', () => {
  describe('given a cli-parser', () => {
    describe('called with no arguments', () => {
      it('accepts', function () {
        const argv = cliParser.parse([ '' ]);
        expect(argv).to.deep.include({
          Help: false
        });
      });
    });
  });
});
