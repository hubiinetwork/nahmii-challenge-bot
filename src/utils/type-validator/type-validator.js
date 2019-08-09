'use strict';

const t = require('flow-runtime');

const int = t.refinement(t.number(), input => {
  if (!Number.isInteger(input))
    return 'Value must be an int';
});
t.int = () => int;

const uint = t.refinement(t.int(), input => {
  if (input < 0)
    return 'Value must be an uint';
});
t.uint = () => uint;

module.exports = t;
