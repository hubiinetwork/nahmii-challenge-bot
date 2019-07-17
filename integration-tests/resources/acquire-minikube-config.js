'use strict';

const minikube = require('../utils/minikube');

process.env['NAHMII_BASE_URL'] = minikube.baseUrl;
process.env['CHALLENGE_BOT_APPID'] = minikube.appId;
process.env['CHALLENGE_BOT_APPSECRET'] = minikube.appSecret;
process.env['ETHEREUM_NODE_URL'] = minikube.nodeUrl;

require('../../src/config');
