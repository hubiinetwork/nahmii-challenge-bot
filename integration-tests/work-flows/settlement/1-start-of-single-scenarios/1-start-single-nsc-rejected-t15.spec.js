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
    require('../../../resources/acquire-actor')(ctx, 'Alice', [['1.0', 'ETH'], ['10.0', 'T15']]);
  });

  describe('D. Alice deposits T15 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '2.0', 'T15');
  });

  describe('E. Alice starts challenge process staging T15', () => {
    require('../work-actions/start-nsc-challenge-rejected')(ctx, 'Carol', 'Alice', '4.0', 'T15');
  });
});
