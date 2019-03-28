'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, paymentName, stageAmount) {
  step (`${walletName} starts driip challenge that is fulfilled`, () => {
    const payment = ctx.purses[walletName][paymentName];
    const contract = ctx.contracts.DriipSettlementChallenge;
    const promise = contract.startChallengeFromPayment(payment, stageAmount);

    expect(promise).to.eventually.be.fulfilled;
  });
};
