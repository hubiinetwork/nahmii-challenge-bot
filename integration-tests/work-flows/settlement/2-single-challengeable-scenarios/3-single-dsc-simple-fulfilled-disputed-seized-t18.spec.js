'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

/*
2.3 Challengeable Single DSC (simplified)
-----------------------------------------
  A deposits 10 T18 - balance 10 T18
  A pays B 5 T18 - balance 4.9 T18
  A pays B 1 T18 ' balance 3.9 T18
  A starts DSC using the first payment, stages 4.0 T18
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

  // A deposits 10 T18
  describe('E. Alice deposits T18 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '10.0', 'T18');
  });

  // A pays B 5 T18
  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'T18');
  });

  // A pays B 1 T18
  describe('G. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_2', '1.0', 'T18');
  });

  // C challenges A’s DSC using the second payment as proof
  describe('H. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-dsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', 'Receipt_1', '4.0', 'T18');
  });

});

