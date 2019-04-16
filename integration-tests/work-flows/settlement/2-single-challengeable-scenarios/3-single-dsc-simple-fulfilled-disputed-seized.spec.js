'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

/*
2.3 Challengeable Single DSC (simplified)
-----------------------------------------
  A deposits 10 ETH
  A pays B 5 ETH
  A pays B 1 ETH
  A starts DSC using the first payment
  C challenges A’s DSC using the second payment as proof
*/

describe('Challengeable Single NSC simplified seized', () => {
  const ctx = {};
/*
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

  describe('E. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-eth')(ctx, 'Alice', '10.0', 'ETH');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'ETH'); // 4.9
  });

  describe('G. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_2', '1.0', 'ETH'); // 3.8
  });

  describe('H. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-dsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', 'Receipt_1', '4.0', 'ETH');
  });
*/
});

