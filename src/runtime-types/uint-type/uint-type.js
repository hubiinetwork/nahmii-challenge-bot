/* eslint-disable padded-blocks */
'use strict';

const t = require('../int-type');

const uint = t.refinement(t.int(), input => {
  if (input < 0)
    return 'must be an uint';
});
t.uint = () => uint;

module.exports = t;
