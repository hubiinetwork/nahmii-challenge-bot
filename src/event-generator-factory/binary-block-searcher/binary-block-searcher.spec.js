'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const given = describe;
const when = describe;

const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const nock = require('nock');
const FakeNahmiiProviderFactory = require('../../nahmii-provider-factory/fake-nahmii-provider-factory');

const fakeBlocks = [];

for (let i = 0; i < 10; ++i) {
  fakeBlocks.push({
    number: i,
    timestamp: i * 10
  });
}

describe ('binary-block-searcher', () => {
  given ('a BinaryBlockSearcher', () => {
    let BinaryBlockSearcher, fakeNahmiiProvider;

    beforeEach(async () => {
      nock.disableNetConnect();
      BinaryBlockSearcher = proxyquire('./binary-block-searcher', {
        '../../nahmii-provider-factory': FakeNahmiiProviderFactory
      });

      fakeNahmiiProvider = await FakeNahmiiProviderFactory.acquireProvider();
      fakeNahmiiProvider.reset();
      fakeNahmiiProvider.getBlock.reset(); // Workaround bug in sinon so callsFake() takes effect
      fakeNahmiiProvider.getBlock.callsFake(i => {
        return fakeBlocks[i];
      });
      fakeNahmiiProvider.getBlockNumber.returns(fakeBlocks.length - 1);
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    when ('searching for a block before-or-equal', () => {

      it('finds block matching exactly medio block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(candidate => {
          return candidate.timestamp - 50;
        });
        expect(block.timestamp).to.equal(50);
      });

      it('finds block matching exactly first in block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(
          candidate => candidate.timestamp - 0
        );
        expect(block.timestamp).to.equal(0);
      });

      it('finds block matching exactly last in block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(
          candidate => candidate.timestamp - 90
        );
        expect(block.timestamp).to.equal(90);
      });

      it('finds block matching approximately medio block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(
          candidate => candidate.timestamp - 55
        );
        expect(block.timestamp).to.equal(50);
      });

      it('finds block matching approximately first in block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(
          candidate => candidate.timestamp - 5
        );
        expect(block.timestamp).to.equal(0);
      });

      it('finds block matching approximately last in block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(
          candidate => candidate.timestamp - 95
        );
        expect(block.timestamp).to.equal(90);
      });

      it('throws if target is before block range', () => {
        return expect(BinaryBlockSearcher.findBlockLte(candidate => candidate.timestamp - (-10))).to.eventually.be.rejectedWith(/Binary search failed/);
      });

      it('finds last block if target is after block range', async () => {
        const block = await BinaryBlockSearcher.findBlockLte(
          candidate => candidate.timestamp - 100
        );
        expect(block.timestamp).to.equal(90);
      });
    });
  });
});
