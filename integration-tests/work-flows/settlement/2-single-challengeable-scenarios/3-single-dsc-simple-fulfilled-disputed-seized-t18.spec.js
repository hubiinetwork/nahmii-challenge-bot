'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('2.3 Challengeable Single DSC (simplified) seized', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', [['1.0', 'ETH']]);
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', [['1.0', 'ETH'], ['15.0', 'T18']]);
  });

  describe('D. Bob as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Bob', [['5.0', 'T18']]);
  });

  describe('E. Alice deposits T18 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '10.0', 'T18');
  });

  describe('F. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_1', '5.0', 'T18');
  });

  describe('G. Alice pays Bob', () => {
    require('../../../work-actions/make-nahmii-payment')(ctx, 'Alice', 'Bob', 'Receipt_2', '1.0', 'T18');
  });

  describe('H. Alice starts disputed challenge process seized by Carol', () => {
    require('../work-actions/start-dsc-challenge-fulfilled-disputed-locked')(ctx, 'Carol', 'Alice', 'Receipt_1', '4.0', 'T18');
  });
});

