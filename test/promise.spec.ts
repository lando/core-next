'use strict';

const {describe, expect, test} = require('bun:test');

const Promise = require('../lib/promise');

describe('promise', () => {
  describe('#Promise', () => {
    test('should have our retry method', () => {
      expect(typeof Promise.retry).toBe('function');
    });

    test('should return a promise instance', () => {
      const promise = new Promise(resolve => resolve());
      expect(promise).toBeInstanceOf(Promise);
    });

    test.skip('should have longStackTraces enabled on instances', () => {
      const promise = new Promise(resolve => resolve());
      expect(promise).toHaveProperty('_trace');
    });

    test.skip('should have our retry method on instances', () => {
      const promise = new Promise(resolve => resolve());
      expect(typeof Object.getPrototypeOf(promise).retry).toBe('function');
    });
  });

  describe('#retry', () => {
    test('should immediately fulfill without retry if promise is not rejected', async () => {
      let counter = 0;
      const func = () => {
        counter = counter + 1;
        return Promise.resolve(counter);
      };
      const result = await Promise.retry(func);
      expect(result).toBe(1);
    });

    test('should retry a rejected promise max times and then reject with Error', async () => {
      const opts = {max: 3, backoff: 1};
      let counter = 0;

      const fail = () => {
        counter = counter + 1;
        return Promise.reject(new Error('Death by Balrog'));
      };

      try {
        await Promise.retry(fail, opts);
        expect(true).toBe(false);
      } catch (err) {
        expect(err.message).toBe('Death by Balrog');
        expect(counter).toBe(opts.max + 1);
      }
    });
  });
});
