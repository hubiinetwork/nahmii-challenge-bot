/* eslint-disable padded-blocks */
'use strict';

const t = require('flow-runtime');

const int = t.refinement(t.number(), input => {
  if (!Number.isInteger(input))
    return 'must be an int';
});
t.int = () => int;

module.exports = t;
