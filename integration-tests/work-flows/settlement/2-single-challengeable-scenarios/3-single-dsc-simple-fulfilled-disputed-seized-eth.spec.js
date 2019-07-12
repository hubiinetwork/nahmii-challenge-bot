'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

/*
2.3 Challengeable Single DSC (simplified)
-----------------------------------------
  A deposits 10 ETH - balance 10 ETH
  A pays B 5 ETH - balance 4.9 ETH
  A pays B 1 ETH ' balance 3.9 ETH
  A starts DSC using the first payment, stages 4.0 ETH
  C challenges A’s DSC using the second payment as proof
*/

describe('2.3 Challengeable Single DSC (simplified) seized', () => {
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

  // A deposits 10 ETH
  describe('E. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '10.0', 'ETH');
  });

  // A pays B 5 ETH
  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'ETH');
  });

  // A pays B 1 ETH
  describe('G. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_2', '1.0', 'ETH');
  });

  // C challenges A’s DSC using the second payment as proof
  describe('H. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-dsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', 'Receipt_1', '4.0', 'ETH');
  });

});

