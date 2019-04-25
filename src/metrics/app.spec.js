'use strict';

const request = require('supertest');

const metrics = require('./index'); // Metrics must be loaded before app to create the counters
metrics.initProgressCounter();

const app = require('./app');

describe('Integration tests', () => {
  const api = request(app);

  describe('GET /metrics', () => {
    it('returns 200 with a valid content type header', async () => {
      return api
        .get('/metrics')
        .expect('Content-Type', /text/)
        .expect(200);
    });
  });

  describe('GET /metrics/challenge_bot_eth_balance', () => {
    it('returns 200 with a valid content type header', async () => {
      return api
        .get('/metrics/challenge_bot_eth_balance')
        .expect('Content-Type', /text/)
        .expect(200);
    });
  });

  describe('GET /metrics/challenge_bot_progress_counter', () => {
    it('returns 200 with a valid content type header', async () => {
      return api
        .get('/metrics/challenge_bot_progress_counter')
        .expect('Content-Type', /text/)
        .expect(200);
    });
  });

  describe('GET /metrics/unknown_metric_name', () => {
    it('returns error code', () => {
      return api
        .get('/metrics/unknown_metric_name')
        .expect(404);
    });
  });
});
