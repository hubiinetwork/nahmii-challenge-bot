'use strict';

function given (str, fn) {
  const gwt = {};
  gwt.gwt = {};
  gwt.gwt.spec = {};
  gwt.gwt.spec.given = { str, fn };
  return { when: when.bind(gwt) };
}

function when (str, fn) {
  this.gwt.spec.when = { str, fn };
  return { then: then.bind(this) };
}

function then (str, fn) {
  const spec = this.gwt.spec;
  const _when = this.gwt.spec.when;
  this.gwt.spec.when = null;

  describe(spec.given.str + ', ' + _when.str + ', ' + str, function () {
    before(function () {
      const given = spec.given.fn.call(this);
      const resulting = _when.fn.call(this, given);
      this.test.parent.gwt = { given, resulting };
    });
    fn.call(this);
  });

  return { when: when.bind(this) };
}

function req (str, fn) {
  it.call(this, str, function () {
    return fn.call(this, this.test.parent.gwt.given, this.test.parent.gwt.resulting);
  });
};

module.exports = {
  given,
  req
};
