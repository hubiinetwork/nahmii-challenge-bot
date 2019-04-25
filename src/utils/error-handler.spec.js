'use strict';

const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);
const {mockReq, mockRes} = require('sinon-express-mock');

const handler = require('./error-handler');

describe('error handler', () => {
    const PAGE_NOT_FOUND_CODE = 404;
    const INTERNAL_ERROR_CODE = 500;

    let error, req, res;

    beforeEach(() => {
        req = mockReq();
        res = mockRes();
    });

    context('given a regular http error in a non-production environment', () => {
        beforeEach(() => {
            error = {
                code: PAGE_NOT_FOUND_CODE,
                message: 'some message',
                stack: 'callstack'
            };
        });

        describe('#errorHandler()', () => {
            beforeEach(() => {
                // Ensure NODE_ENV is not picking up something silly from the calling process
                delete process.env.NODE_ENV;
                handler(error, req, res);
            });

            it('sets the response status to match error code', () => {
                expect(res.status).to.have.been.calledWith(PAGE_NOT_FOUND_CODE);
            });

            it('sends a JSON response with the message and callstack', () => {
                expect(res.json).to.have.been.calledWith({
                    message: 'some message',
                    stack: 'callstack'
                });
            });
        });
    });

    context('given a regular error without code', () => {
        beforeEach(() => {
            error = {
                message: 'some message',
                stack: 'callstack'
            };
        });

        describe('#errorHandler()', () => {
            beforeEach(() => {
                handler(error, req, res);
            });

            it('sets the response status to default code', () => {
                expect(res.status).to.have.been.calledWith(INTERNAL_ERROR_CODE);
            });
        });
    });

    context('given a regular http error in a production environment', () => {
        beforeEach(() => {
            error = {
                code: PAGE_NOT_FOUND_CODE,
                message: 'some message',
                stack: 'callstack'
            };
        });

        describe('#errorHandler()', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'production';
                handler(error, req, res);
            });

            afterEach(() => {
                delete process.env.NODE_ENV;
            });

            it('sets the response status to match error code', () => {
                expect(res.status).to.have.been.calledWith(PAGE_NOT_FOUND_CODE);
            });

            it('sends a JSON response with only the message', () => {
                expect(res.json).to.have.been.calledWith({
                    message: 'some message'
                });
            });
        });
    });
});
