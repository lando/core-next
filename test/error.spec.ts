'use strict';

const {describe, expect, test, jest} = require('bun:test');
const ErrorHandler = require('./../lib/error');
const EventEmitter = require('events').EventEmitter;
const Metrics = require('./../lib/metrics');

describe('error', () => {
  describe('#ErrorHandler', () => {
    test('should return an ErrorHandler instance with correct default options', () => {
      const error = new ErrorHandler();
      expect(error).toBeInstanceOf(ErrorHandler);
      expect(error.log).toBeInstanceOf(EventEmitter);
      expect(error.metrics).toBeInstanceOf(Metrics);
    });
  });

  describe('#handle', () => {
    test('should return error code if specified', async () => {
      const error = new ErrorHandler({error: jest.fn()}, {report: () => Promise.resolve(true)});
      const code = await error.handle({message: 'trouble trouble trouble', stack: 'stack', code: 666});
      expect(code).toBe(666);
    });

    test('should return 1 if error code is not specified', async () => {
      const error = new ErrorHandler({error: jest.fn()}, {report: () => Promise.resolve(true)});
      const code = await error.handle({message: 'trouble trouble trouble', stack: 'stack'});
      expect(code).toBe(1);
    });

    test('should log message and report to metrics by default', async () => {
      const errorSpy = jest.fn();
      const error = new ErrorHandler({error: errorSpy}, {report: () => Promise.resolve(true)});
      const code = await error.handle();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(code).toBe(1);
    });

    test('should not log error when error.hide is true', async () => {
      const errorSpy = jest.fn();
      const error = new ErrorHandler({error: errorSpy}, {report: () => Promise.resolve(true)});
      await error.handle({message: 'super long; don\'t log', stack: 'stack', hide: true});
      expect(errorSpy).toHaveBeenCalledTimes(0);
    });

    test('should log stack instead of message when error.verbose > 0', async () => {
      const errorSpy = jest.fn();
      const error = new ErrorHandler({error: errorSpy}, {report: () => Promise.resolve(true)});
      await error.handle({message: 'message', stack: 'stack', verbose: 1, code: 4});
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith('stack');
    });
  });
});
