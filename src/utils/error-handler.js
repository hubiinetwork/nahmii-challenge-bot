'use strict';

//eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    res.status(err.code || 500);

    let response = {
        message: err.message
    };

    if (process.env['NODE_ENV'] !== 'production')
        response.stack = err.stack;

    res.json(response);
}

module.exports = errorHandler;
