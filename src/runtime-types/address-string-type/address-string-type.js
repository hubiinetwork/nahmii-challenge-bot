'use strict';

const t = require('flow-runtime');

const AddressStringT = t.refinement(t.any(), input => {
  if (!((typeof input === 'string') && /0x[0-9a-f]{40}/i.test(input)))
    return 'must be an address string';
});
t.AddressString = () => AddressStringT;

module.exports = t;
