'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;

const given = describe;
const when = describe;
const then = it;

const minikube = require('../utils/minikube');

process.env['NAHMII_BASE_URL'] = minikube.baseUrl;
process.env['CHALLENGE_BOT_APPID'] = minikube.appId;
process.env['CHALLENGE_BOT_APPSECRET'] = minikube.appSecret;
process.env['ETHEREUM_NODE_URL'] = minikube.nodeUrl;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

require('../../src/config');

const contractRepository = require('../../src/contract-repository');
const EventGenerator = require('../../src/event-generator');

async function acquireTopic(contractName, eventName) {
  const contract = await contractRepository.acquireContract(contractName);
  const topic = contract.interface.events[eventName].topic;
  return topic;
}

describe('event-generator', () => {
  const topics = [];

  before(async () => {
    const eventsSpects = [
      { contractName: 'NullSettlementChallengeByPayment', eventName: 'StartChallengeEvent' }
    ];

    for(const spec of eventsSpects) {
      const contract = await contractRepository.acquireContract(spec.contractName);
      const topic = contract.interface.events[spec.eventName].topic;
      topics.push(topic);
    }
  });

  given('an EventGenerator constructor', () => {
    when('it is called with valid arguments', () => {
      let eventGenerator;

      beforeEach(() => {
        eventGenerator = new EventGenerator();
      });

      then('an EventGenerator is constructed', () => {
        expect(eventGenerator).to.be.instanceOf(EventGenerator);
      });

      then('it can be started', () => {
        return expect(eventGenerator.start(topics)).to.eventually.be.fulfilled;
      });
    });
  });
});