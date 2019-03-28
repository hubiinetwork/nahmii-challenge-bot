'use strict';

module.exports = function (ctx, challengerName, walletName, paymentName, stageAmount, symbol) {

  require('../work-steps/proposals/has-no-dsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-dsc-proposal-nonce')(ctx, walletName, symbol);

  require('../../../work-steps/contracts/DriipSettlementChallenge/startChallengeFromPayment-to-be-rejected')(ctx, walletName, paymentName, stageAmount);

  require('../work-steps/proposals/has-no-dsc-proposal-status')(ctx, walletName, symbol);
  require('../work-steps/proposals/has-no-dsc-proposal-nonce')(ctx, walletName, symbol);
};
