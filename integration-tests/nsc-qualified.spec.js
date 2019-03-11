'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Qualified null settlement challenge', () => {
  const ctx = {
    wallets: {},
    purses: {},
    contracts: {}
  };

  describe('Acquire resources', () => {
    require('./mix-ins/resources/acquire-resources')(ctx);
  });

  describe('A. Alice as actor', () => {
    require('./mix-ins/resources/acquire-actor')(ctx, 'Alice');
  });

  describe('B. Alice deposits ETH to nahmii', () => {
    require('./mix-ins/work-steps/deposit-eth')(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('C. Alice stages ETH', () => {
    require('./mix-ins/work-steps/nsc-start-challenge')(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('D. Alice settles ETH', () => {
    require('./mix-ins/work-steps/nsc-settle-qualified')(ctx, 'Alice', '0.002', 'ETH');
  });

  describe('E. Alice withdraws ETH', () => {
    require('./mix-ins/work-steps/nsc-withdraw-qualified')(ctx, 'Alice', '0.002', 'ETH');
  });
});
