'use strict';

module.exports = function (ctx) {
  step('NODE_TLS_REJECT_UNAUTHORIZED = 0', () => {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  });
  require('./acquire-context')(ctx);
  require('./acquire-currencies')(ctx);
  require('./acquire-provider')(ctx);
  require('./acquire-faucet')(ctx);
  require('./acquire-miner')(ctx);
  require('./acquire-contracts')(ctx);
};
