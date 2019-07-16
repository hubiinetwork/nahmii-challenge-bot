'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

describe('Start Single NSC fulfilled agreed T18', () => {
  const ctx = {};

  describe('A. Acquire resources', () => {
    require('../../../resources/acquire-resources')(ctx);
  });

  describe('B. Carol as challenger', () => {
    require('../../../resources/acquire-challenger')(ctx, 'Carol', [['1.0', 'ETH']]);
  });

  describe('C. Alice as actor', () => {
    require('../../../resources/acquire-actor')(ctx, 'Alice', [['1.0', 'ETH'], ['10.0', 'T18']]);
  });

  describe('D. Alice deposits T18 to nahmii', () => {
    require('../../../work-actions/deposit-amount')(ctx, 'Alice', '2.0', 'T18');
  });

  describe('E. Alice starts challenge process T18', () => {
    require('../work-actions/start-nsc-challenge-fulfilled-agreed')(ctx, 'Carol', 'Alice', '2.0', 'T18');
  });

  describe('F. Alice settles T18', () => {
    require('../work-actions/nsc-settle-qualified')(ctx, 'Alice', '2.0', 'T18');
  });

  describe('G. Alice withdraws T18', () => {
    require('../work-actions/withdraw-qualified')(ctx, 'Alice', '2.0', 'T18');
  });
});
