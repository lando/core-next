

import _ from 'lodash';
import {describe, expect, test} from 'bun:test';

import AsyncEvents from '../lib/events';

describe('events', () => {
  describe('#AsyncEvents', () => {
    test('should return an events instance with correct default options', () => {
      const events = new AsyncEvents();
      expect(events).toBeInstanceOf(AsyncEvents);
      expect(typeof events).toBe('object');
      expect(events).toHaveProperty('log');
      expect(events._maxListeners).toBe(64);
      expect(events._listeners).toBeInstanceOf(Array);
      expect(events._listeners).toHaveLength(0);
      expect(events._eventsCount).toBe(0);
    });

    test('should return an events instance with custom log option', () => {
      const log = {debug: () => {}, verbose: () => {}, silly: () => {}};
      const events = new AsyncEvents(log);
      expect(events.log).toBe(log);
    });
  });

  describe('#on', () => {
    test('should run events without priority at priority 5', () => {
      const events = new AsyncEvents();
      const same1 = function() {};
      const same2 = function() {};
      events.on('event', same1);
      events.on('event', same2);
      const priorityFiveEvents = _(events._listeners)
        .filter(event => event.name === 'event')
        .filter(event => event.priority === 5)
        .size();
      expect(priorityFiveEvents).toBe(2);
    });

    test('should run events in priority from lowest to highest', async () => {
      const events = new AsyncEvents();
      const callOrder = [];
      const before = function() {
        callOrder.push('before');
      };
      const middle = function() {
        callOrder.push('middle');
      };
      const after = function() {
        callOrder.push('after');
      };
      events.on('event', 4, before);
      events.on('event', middle);
      events.on('event', 6, after);
      await events.emit('event');
      expect(callOrder).toEqual(['before', 'middle', 'after']);
    });
  });

  describe('#emit', () => {
    test('should return a promise', () => {
      const events = new AsyncEvents();
      expect(events.emit('testEvent')).toHaveProperty('then');
    });

    test('should pass optional data from emit into on', async () => {
      const data = {maneuver: 'little'};
      const events = new AsyncEvents();
      let receivedData = null;
      const handler = function(d) {
        receivedData = d;
      };
      events.on('battle-of-tanaab', handler);
      await events.emit('battle-of-tanaab', data);
      expect(receivedData).not.toBeNull();
      expect(receivedData.maneuver).toBe('little');
    });
  });
});
