'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('1-single-nsc-simple-fulfilled-disputed-seized', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', [['1.0', 'ETH']]);
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', [['15.0', 'ETH']]);
  });

  describe('D. Bob as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Bob', [['5.0', 'ETH']]);
  });

  describe('E. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '10.0', 'ETH');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'ETH');
  });

  describe('G. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-nsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', '5.0', 'ETH');
  });
});

