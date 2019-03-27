'use strict';

module.exports = (ctx) => {
  step('Create DSC ChallengeByPaymentEvent listener', async () => {
    ctx.promises.dscChallengeByPaymentEvent = new Promise(resolve => {
      ctx.contracts.driipSettlementDispute.on('ChallengeByPaymentEvent', (wallet, nonce, driipHash, driipType, candidateHash, challenger) => {
        resolve({ wallet, nonce, driipHash, driipType, candidateHash, challenger });
      });
    });
  });
};
