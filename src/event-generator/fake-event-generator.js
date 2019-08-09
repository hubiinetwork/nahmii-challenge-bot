'use strict';

const t = require('../utils/type-validator');

class FakeEventGenerator {
  constructor (blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth) {
    t.uint().assert(blockPullDelayMs);
    t.uint().assert(maxBlockQueryRange);
    t.uint().assert(catchupConfirmationsDepth);
    t.uint().assert(generalConfirmationsDepth);

    this.config = {
      blockPullDelayMs, maxBlockQueryRange, catchupConfirmationsDepth, generalConfirmationsDepth
    };
  }
}

module.exports = FakeEventGenerator;
