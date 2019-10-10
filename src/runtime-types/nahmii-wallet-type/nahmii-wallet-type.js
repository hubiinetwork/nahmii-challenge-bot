/* eslint-disable padded-blocks */
'use strict';

const t = require('flow-runtime');
const nahmii = require('nahmii-sdk');

const NahmiiWallet = t.refinement(t.any(), input => {
  if (!(input instanceof nahmii.Wallet))
    return 'must be an nahmii Wallet';
});
t.NahmiiWallet = () => NahmiiWallet;

module.exports = t;
