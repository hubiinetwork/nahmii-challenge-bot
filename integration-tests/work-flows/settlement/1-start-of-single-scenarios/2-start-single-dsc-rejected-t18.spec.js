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
    require('../../../resources/acquire-actor')(ctx, 'Alice', [[ '1.0', 'ETH'], ['6.0', 'T18']]);
  });

  describe('D. Bob as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Bob', [[ '1.0', 'ETH'], ['2.0', 'T18']]);
  });

  describe('E. Alice deposits T18 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '4.0', 'T18');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '2.0', 'T18');
  });

  describe('G. Alice starts challenge process T18', () => {
    require('../work-actions/start-dsc-challenge-rejected')(ctx, 'Carol', 'Alice', 'Receipt_1', '2.0', 'T18');
  });
});
