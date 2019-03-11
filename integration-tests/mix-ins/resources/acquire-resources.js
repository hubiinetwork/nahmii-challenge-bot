'use strict';

module.exports = function (ctx) {
  require('./acquire-provider')(ctx);
  require('./acquire-faucet')(ctx);
  require('./acquire-miner')(ctx);
  require('./acquire-contracts')(ctx);
};
