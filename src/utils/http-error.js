'use strict';

class HttpError extends Error {
  constructor(code, ...params) {
    super(...params);
    this.code = code;
    Error.captureStackTrace(this, HttpError);
  }
}

module.exports = HttpError;
