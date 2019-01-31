'use strict';

const DriipSettlementChallenge = {
  address: '0xf88aa13327385931e56410f97f8cd631f95216e4',
  abi: [
    'event StartChallengeFromPaymentEvent(address wallet, bytes32 paymentHash, int256 stageAmount)',
    'event StartChallengeFromPaymentByProxyEvent(address proxy, address wallet, bytes32 paymentHash, int256 stageAmount)'
  ]
};

function onStartChallengeFromPaymentEvent (handleChallenge) {
  const ethPrv = ethers.getDefaultProvider('ropsten');
  const contract = new ethers.Contract(DriipSettlementChallenge.address, DriipSettlementChallenge.abi, ethPrv);
  contract.on('StartChallengeFromPaymentEvent', (wallet, paymentHash, stageAmount) => {
    handleChallenge('0x'+wallet, paymentHash, stageAmount);
  });
  contract.on('StartChallengeFromPaymentByProxyEvent', (_proxy, wallet, paymentHash, stageAmount) => {
    handleChallenge(wallet, paymentHash, stageAmount);
  });
}

module.export = {
  getEventualChallengeInfo
};
