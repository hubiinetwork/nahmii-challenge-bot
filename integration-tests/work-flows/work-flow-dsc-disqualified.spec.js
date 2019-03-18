'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Qualified driip settlement challenge', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../resources/acquire-challenger')(ctx, 'Carol', '1.0');
  });

  describe('C. Alice as actor', () => {
    require('../resources/acquire-actor')(ctx, 'Alice', '1.0');
  });

  describe('D. Bob as actor', () => {
    require('../resources/acquire-actor')(ctx, 'Bob', '1.0');
  });

  describe('E. Alice deposits ETH to nahmii', () => {
    require('../work-actions/deposit-eth')(ctx, 'Alice', '0.2', 'ETH');
  });

  describe('F. Alice pays Bob', () => {
    require('../work-actions/make-payment')(ctx, 'Alice', '-0.1001', 'Bob', '0.1', 'ETH');
  });

  describe('G. Alice starts challenge process ETH', () => {
    require('../work-actions/dsc-start-challenge')(ctx, 'Carol', 'Alice', '0.05', 'ETH');
  });

  describe('H. Alice settles ETH', () => {
    require('../work-actions/dsc-settle-qualified')(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('I. Alice withdraws ETH', () => {
    require('../work-actions/dsc-withdraw-qualified')(ctx, 'Alice', '0.002', 'ETH');
  });

});
