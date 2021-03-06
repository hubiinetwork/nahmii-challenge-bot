'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Start Single NSC rejected', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', [['1.0', 'ETH']]);
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', [['10.0', 'ETH']]);
  });

  describe('D. Alice deposits ETH to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '2.0', 'ETH');
  });

  describe('E. Alice starts challenge process staging ETH', () => {
    require('../work-actions/start-nsc-challenge-rejected')(ctx, 'Carol', 'Alice', '4.0', 'ETH');
  });
});
