'use strict';

const {describe, expect, test, beforeEach} = require('bun:test');
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const path = require('path');

const Log = require('./../lib/logger');

describe('logger', () => {
  beforeEach(() => {
    fs.rmSync('/tmp/logz', {recursive: true, force: true});
  });

  describe('#Log', () => {
    test('should return a Log instance with correct default options', () => {
      const log = new Log();
      expect(log).toBeInstanceOf(EventEmitter);
      expect(log.exitOnError).toBe(true);
      expect(typeof log.transports).toBe('object');
      expect(log.transports).toHaveProperty('console');
      expect(log.transports.console).toBeInstanceOf(EventEmitter);
      expect(log.transports.console.level).toBe('warn');
      _.forEach(['error', 'warn', 'info', 'verbose', 'debug', 'silly'], level => {
        expect(typeof log[level]).toBe('function');
      });
    });

    test('should return a Log instance with custom logLevelConsole', () => {
      const log = new Log({logLevelConsole: 'info'});
      expect(log.transports.console.level).toBe('info');
    });

    test('should return a Log instance with custom integer logLevelConsole', () => {
      const logLevels = {
        '0': 'error',
        '1': 'warn',
        '2': 'info',
        '3': 'verbose',
        '4': 'debug',
        '5': 'silly',
      };
      _.forEach(logLevels, (word, num) => {
        const log = new Log({logLevelConsole: _.toInteger(num)});
        expect(log.transports.console.level).toBe(word);
      });
    });

    test('should create a log directory and file transports if logDir specified', () => {
      void require(path.resolve('./node_modules/winston/lib/winston/transports/file')).File;
      const log = new Log({logDir: '/tmp/logz', logLevel: 'warn'});
      expect(fs.existsSync('/tmp/logz')).toBe(true);
      _.forEach(['error-file', 'log-file'], transport => {
        expect(typeof log.transports).toBe('object');
        expect(log.transports).toHaveProperty(transport);
        expect(log.transports[transport]).toBeInstanceOf(EventEmitter);
        expect(log.transports[transport].level).toBe('warn');
      });
    });
  });
});
