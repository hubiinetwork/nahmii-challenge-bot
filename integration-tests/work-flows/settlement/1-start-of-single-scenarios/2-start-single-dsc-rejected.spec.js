'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Start Single DSC accepted', () => {
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

  describe('E. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-eth')(ctx, 'Alice', '10.0', 'ETH');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'ETH');
  });

  describe('G. Alice starts challenge process ETH', () => {
    require('../work-actions/dsc-challenge-rejected')(ctx, 'Carol', 'Alice', 'Receipt_1', '5.0', 'ETH');
  });
/*
  describe('', () => {
    it('pause to ensure logs are flushed before termination', done => {
      (new Promise(resolve => setTimeout(resolve, 30000))).then(() => done());
    });
  });
*/
});
