'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Start Single DSC accepted', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', [['1.0', 'ETH']]);
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', [[ '1.0', 'ETH'], ['6000.0', 'T15']]);
  });

  describe('D. Bob as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Bob', [[ '1.0', 'ETH'], ['2000.0', 'T15']]);
  });

  describe('E. Alice deposits T15 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '4000.0', 'T15');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '2000.0', 'T15');
  });

  describe('G. Alice starts challenge process T15', () => {
    require('../work-actions/start-dsc-challenge-rejected')(ctx, 'Carol', 'Alice', 'Receipt_1', '2000.0', 'T15');
  });
});
