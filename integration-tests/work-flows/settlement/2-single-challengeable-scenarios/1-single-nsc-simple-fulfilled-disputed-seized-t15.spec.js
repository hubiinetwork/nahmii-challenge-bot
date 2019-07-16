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
    require('../../../resources/acquire-actor')(ctx, 'Alice', [['1.0', 'ETH'], ['15000.0', 'T15']]);
  });

  describe('D. Bob as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Bob', [['5000.0', 'T15']]);
  });

  describe('E. Alice deposits T15 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '10000.0', 'T15');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5000.0', 'T15');
  });

  describe('G. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-nsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', '5000.0', 'T15');
  });
});

