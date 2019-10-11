'use strict';

const EventRepeater = require('./event-repeater');

let _eventRepeater;

function acquireEventRepeater () {
  if (!_eventRepeater) {
    _eventRepeater = new EventRepeater();
  }

  return _eventRepeater;
}

module.exports = {
  acquireEventRepeater
};
