/* eslint-disable padded-blocks */
'use strict';

const t = require('flow-runtime');
const ethers = require('ethers');

const EthersBigNumber = t.refinement(t.any(), input => {
  if (!(input instanceof ethers.utils.BigNumber))
    return 'must be an ethers BigNumber';
});
t.EthersBigNumber = () => EthersBigNumber;

module.exports = t;
