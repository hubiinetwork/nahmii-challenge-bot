'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

module.exports = function (ctx, walletName, paymentName, stageAmount, symbol) {
  require('./startChallengeFromPayment')(
    ctx, `${walletName} starts DSC that is rejected`,
    walletName, paymentName, stageAmount, symbol,
    (promise) => expect(promise).to.eventually.be.rejected
  );
};