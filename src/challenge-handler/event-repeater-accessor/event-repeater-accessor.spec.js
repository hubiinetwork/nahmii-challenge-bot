/* eslint-disable no-unused-expressions */
'use strict';

const chai = require('chai');
const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

const expect = chai.expect;
const given = describe;
const when = describe;

class FakeEventRepeater {
}

function requireEventRepeaterAccessor () {
  return proxyquire('./event-repeater-accessor', {
    './event-repeater': FakeEventRepeater
  });
}

describe('event-repeater-accessor', () => {
  given ('an EventRepeaterAccessor', () => {
    let accessor;

    beforeEach(() => {
      accessor = requireEventRepeaterAccessor();
    });

    when ('acquiring an event repeater first time', () => {
      it ('creates and retrieves an EventRepeater', () => {
        expect(accessor.acquireEventRepeater()).to.be.instanceOf(FakeEventRepeater)
      });
    });
    when ('acquiring an event repeater the second time time', () => {
      it ('retrieves the existing EventRepeater', () => {
        const repeater1 = accessor.acquireEventRepeater();
        const repeater2 = accessor.acquireEventRepeater();

        expect(repeater1).to.be.instanceOf(FakeEventRepeater);
        expect(repeater1).to.equal(repeater2);
      });
    });
  });
});
