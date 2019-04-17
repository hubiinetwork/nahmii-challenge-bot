'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

/*
2.1 Challengeable Single NSC (simplified)
-----------------------------------------
  A deposits 10 ETH
  A pays B 5 ETH
  A starts NSC
  C challenges A’s NSC with the payment as proof
*/

describe('Challengeable Single NSC simplified seized', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', '10.0');
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', '15.0');
  });

  describe('D. Bob as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Bob', '5.0');
  });

  // A deposits 10 ETH - Balance 10 ETH
  describe('E. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-eth')(ctx, 'Alice', '10.0', 'ETH');
  });

  // A pays B 5 ETH - Balance 4.9 ETH
  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'ETH');
  });

  // C challenges A’s NSC with the payment as proof - Balance 4.9 ETH - Withdraw 5.0 ETH
  describe('G. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-nsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', '5.0', 'ETH');
  });

});

