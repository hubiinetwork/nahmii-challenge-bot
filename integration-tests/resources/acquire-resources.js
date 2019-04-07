'use strict';

const ethers = require('ethers');

module.exports = function (ctx) {
  step('NODE_TLS_REJECT_UNAUTHORIZED = 0', () => {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  });
  ctx.gasLimit = ethers.utils.bigNumberify('8000000');
  require('./acquire-context')(ctx);
  require('./acquire-currencies')(ctx);
  require('./acquire-provider')(ctx);
  require('./acquire-faucet')(ctx);
  require('./acquire-miner')(ctx);
  require('./acquire-contracts')(ctx);
};
