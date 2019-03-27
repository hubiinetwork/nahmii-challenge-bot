'use strict';

module.exports = (ctx) => {
  step('Create NSC ChallengeByPaymentEvent listener', async () => {
    ctx.promises.nscChallengeByPaymentEvent = new Promise(resolve => {
      ctx.contracts.nullSettlementDispute.on('ChallengeByPaymentEvent', (wallet, nonce, driipHash, driipType, candidateHash, challenger) => {
        resolve({ wallet, nonce, driipHash, driipType, candidateHash, challenger });
      });
    });
  });
};
