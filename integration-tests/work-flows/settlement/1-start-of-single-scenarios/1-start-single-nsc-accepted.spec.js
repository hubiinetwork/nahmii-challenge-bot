'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Start Single NSC accepted', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });4

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', '10.0');
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', '10.0');
  });

  describe('D. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-eth')(ctx, 'Alice', '2.0', 'ETH');
  });

  describe('E. Alice starts challenge process ETH', () => {
    require('../work-actions/start-nsc-challenge-to-be-fulfilled')(ctx, 'Carol', 'Alice', '2.0', 'ETH');
  });

  describe('F. Alice settles ETH', () => {
    require('../work-actions/nsc-settle-qualified')(ctx, 'Alice', '2.0', 'ETH');
  });

  describe('G. Alice withdraws ETH', () => {
    require('../work-actions/withdraw-qualified')(ctx, 'Alice', '2.0', 'ETH');
  });

});
