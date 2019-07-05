'use strict';

const ethers = require('ethers');

module.exports = function (ctx) {
  step('NODE_TLS_REJECT_UNAUTHORIZED = 0', () => {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  });
  ctx.gasLimit = ethers.utils.bigNumberify('8000000');
  require('./acquire-minikube-config');
  require('./acquire-context')(ctx);
  require('./acquire-currencies')(ctx);
  require('./acquire-provider')(ctx);
  require('./acquire-faucet')(ctx);
  require('./acquire-miner')(ctx);
  require('./acquire-contracts')(ctx);
  require('./donate-to-external-challenge-bot')(ctx, '0x026e46ff3d3b2c72b07ed9a2ec4d17d5b98c7ce0', '0.1');
};
