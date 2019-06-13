'use strict';

const chai = require('chai');
const expect = chai.expect;

const FakeNahmiiContract = require('./fake-nahmii-contract');

describe('fake-nahmii-contract', () => {
  describe('given an FakeNahmiiContract', () => {
    let fakeNahmiiContract;

    beforeEach(() => {
      fakeNahmiiContract = new FakeNahmiiContract('ClientFund');
    });

    describe ('when it is called to emit an unknown event', () => {
      it ('throws an exception', () => {
        expect(() => fakeNahmiiContract.emit('UnknownEvent', () => {})).to.throw(/failed to emit event for unknown event/);
      });
    });
  });
});