'use strict';

const { EthereumAddress } = require('nahmii-ethereum-address');
const t = require('flow-runtime');

const EthereumAddressT = t.refinement(t.any(), input => {
  if (!(input instanceof EthereumAddress))
    return 'must be an EthereumAddress';
});
t.EthereumAddress = () => EthereumAddressT;

module.exports = t;
