'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const {request_logger} = require('@hubiinetwork/logger');
const errorHandler = require('../utils/error-handler');
const HttpError = require('../utils/http-error');
const {register} = require('prom-client');

const app = express();
app.use(helmet());
app.use(cors());
app.use(request_logger);

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});

app.get('/metrics/:metric', (req, res, next) => {
  try {
    const metric = register.getSingleMetricAsString(req.params.metric);
    res.set('Content-Type', register.contentType);
    res.end(metric);
  }
  catch (err) {
    return next(new HttpError(404, 'Metric not found'));
  }
});

app.use(errorHandler);

module.exports = app;
