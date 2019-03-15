'use strict';

module.exports = (ctx) => {
  step('Create StageEvent listener', async () => {
    ctx.promises.StageEvent = new Promise(resolve => {
      ctx.contracts.clientFund.on('StageEvent', (initiatorWallet, stagedAmount, stagedCt, stageId) => {
        resolve({ initiatorWallet, stagedAmount, stagedCt, stageId });
      });
    });
  });
};
