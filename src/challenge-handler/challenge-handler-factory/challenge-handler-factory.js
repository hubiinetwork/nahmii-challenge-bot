'use strict';

const ChallengeHandler = require('../challenge-handler');
const contracts = require('../contract-repository');
const NestedError = require('../../utils/nested-error');

async function create (wallet, gasLimit) {
  const handler = new ChallengeHandler(wallet, gasLimit);

  try {
    (await contracts.getDriipSettlementChallengeByPayment()).on('StartChallengeFromPaymentEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id) => {
      handler.handleDSCStart(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    (await contracts.getDriipSettlementChallengeByPayment()).on('StartChallengeFromPaymentByProxyEvent', (wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      handler.handleDSCStart(wallet, nonce, cumulativeTransferAmount, stageAmount, targetBalanceAmount, ct, id);
    });

    (await contracts.getDriipSettlementDisputeByPayment()).on('ChallengeByPaymentEvent', (challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet) => {
      handler.handleWalletLocked('DSC Locked', challengedWallet, nonce, stageAmount, targetBalanceAmount, ct, id, challengerWallet);
    });

    (await contracts.getNullSettlementChallengeByPayment()).on('StartChallengeEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id) => {
      handler.handleNSCStart(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    (await contracts.getNullSettlementChallengeByPayment()).on('StartChallengeByProxyEvent', (wallet, nonce, stageAmount, targetBalanceAmount, ct, id, _proxy) => {
      handler.handleNSCStart(wallet, nonce, stageAmount, targetBalanceAmount, ct, id);
    });

    (await contracts.getNullSettlementDisputeByPayment()).on('ChallengeByPaymentEvent', (challengedWallet, nonce, payment, challengerWallet) => {
      handler.handleWalletLocked('NSC Locked', challengedWallet, nonce, payment, challengerWallet);
    });

    (await contracts.getClientFund()).on('SeizeBalancesEvent', (seizedWallet, seizerWallet, value, ct, id) => {
      handler.handleBalancesSeized.call(this, seizedWallet, seizerWallet, value, ct, id);
    });
  }
  catch (err) {
    throw new NestedError (err, 'Failed to initialize contract event handlers. ' + err.message);
  }

  return handler;
}

module.exports = {
  create
};
