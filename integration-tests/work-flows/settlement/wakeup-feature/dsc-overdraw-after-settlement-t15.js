'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('dsc-dispute-late-payment-t15', () => {
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
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '4000.0', 'T15');
  });

  describe('G. Alice starts challenge process T15', () => {
    require('../work-actions/start-dsc-challenge-fulfilled-agreed')(ctx, 'Carol', 'Alice', 'Receipt_1', '5000.0', 'T15');
  });

  describe('H. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-overdraw')(ctx, 'Alice', 'Bob', 'Receipt_2', '3000.0', 'T15');
  });

  describe('I. Alice settles T15', () => {
    require('../work-actions/dsc-settle-qualified')(ctx, 'Alice', 'Receipt_1', '5000.0', 'T15');
  });
});

