'use strict';

const _ = require('lodash');
const {describe, expect, test, beforeEach, jest} = require('bun:test');
const fs = require('fs');
const NodeCache = require('node-cache');

const Cache = require('./../lib/cache');

describe('cache', () => {
  beforeEach(() => {
    fs.rmSync('/tmp/cache', {recursive: true, force: true});
  });

  describe('#Cache', () => {
    test('should return a cache instance with correct default options', () => {
      const cache = new Cache();
      expect(cache).toBeInstanceOf(Cache);
      expect(typeof cache).toBe('object');
      expect(cache).toHaveProperty('options');
      expect(cache.options).toHaveProperty('stdTTL', 0);
      expect(cache.options).toHaveProperty('checkperiod', 600);
      expect(cache.options).toHaveProperty('errorOnMissing', false);
      expect(cache.options).toHaveProperty('useClones', true);
      expect(cache.options).toHaveProperty('deleteOnExpire', true);
    });

    test('should return a cache instance with custom log option', () => {
      const log = jest.fn();
      const cache = new Cache({log: log});
      expect(cache.log).toBe(log);
    });

    test('should return a cache instance with custom cachedir option', () => {
      const cache = new Cache({cacheDir: '/tmp/cache'});
      expect(cache.cacheDir).toBe('/tmp/cache');
    });

    test('should create the cache directory', () => {
      const cache = new Cache({cacheDir: '/tmp/cache'});
      expect(cache.cacheDir).toBe('/tmp/cache');
      expect(fs.existsSync('/tmp/cache')).toBe(true);
    });
  });

  describe('#__get', () => {
    test('should be the same as new NodeCache().get', () => {
      const cache = new Cache();
      cache.set('yyz', 'amazing');

      const nCache = new NodeCache();
      nCache.set('yyz', 'amazing');

      expect(cache.__get('yyz')).toEqual(nCache.get('yyz'));
    });
  });

  describe('#__set', () => {
    test('should be the same as new NodeCache().set', () => {
      const cache = new Cache();
      const nCache = new NodeCache();
      expect(cache.__set('yyz', 'amazing')).toEqual(nCache.set('yyz', 'amazing'));
    });
  });

  describe('#__del', () => {
    test('should be the same as new NodeCache().del', () => {
      const cache = new Cache();
      const nCache = new NodeCache();
      cache.__set('yyz', 'amazing');
      const returnone = cache.__del('yyz');
      nCache.set('yyz', 'amazing');
      const returntwo = nCache.del('yyz');

      expect(returnone).toEqual(returntwo);
    });
  });

  describe('#set', () => {
    test('should set a cached key in memory', () => {
      const cache = new Cache({cacheDir: '/tmp/cache'});
      cache.set('yyz', 'amazing');
      expect(fs.existsSync('/tmp/cache/yyz')).toBe(false);
    });

    test('should log a failure when key cannot be cached in memory', () => {
      const debugSpy = jest.fn();
      const cache = new Cache({log: {debug: debugSpy}});
      jest.spyOn(cache, '__set').mockReturnValue(false);
      cache.set('test', 'thing');
      const call = debugSpy.mock.calls[0];
      expect(_.includes(call[0], 'Failed')).toBe(true);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });

    test('should remove a cached key in memory after ttl has expired', () => {
      jest.useFakeTimers();

      const cache = new Cache();

      cache.set('yyz', 'amazing', {ttl: 1});
      expect(cache.get('yyz')).toEqual('amazing');

      jest.advanceTimersByTime(1500);

      expect(cache.get('yyz')).toBeUndefined();
      jest.useRealTimers();
    });

    test('should set a cached key in a file if persist is set', () => {
      const cache = new Cache({cacheDir: '/tmp/cache'});
      cache.set('yyz', 'amazing', {persist: true});
      expect(fs.existsSync('/tmp/cache/yyz')).toBe(true);
    });

    test('should throw an error for unsafe cache keys', () => {
      const cache = new Cache();
      expect(() => cache.set('yyz:amazing', 'alltime')).toThrow('Invalid cache key');
    });
  });

  describe('#get', () => {
    test('should return a cached key from memory', () => {
      const cache = new Cache();
      cache.set('best_drummer', 'Neal Peart');
      expect(cache.get('best_drummer')).toEqual('Neal Peart');
    });

    test('should fail to return a cached key from memory if ttl is expired', () => {
      jest.useFakeTimers();

      const cache = new Cache();

      cache.set('yyz', 'amazing', {ttl: 1});
      expect(cache.get('yyz')).toEqual('amazing');

      jest.advanceTimersByTime(1500);

      expect(cache.get('yyz')).toBeUndefined();
      jest.useRealTimers();
    });

    test('should return a cached key from file if persists is set', () => {
      const cache = new Cache({cacheDir: '/tmp/cache'});
      cache.set('yyz', 'amazing', {persist: true});
      expect(cache.get('yyz')).toEqual('amazing');
    });

    test('should return undefined when grabbing an unset key', () => {
      const cache = new Cache();
      expect(cache.get('BOGUSKEY-I-LOVE-NICK3LBACK-4-LYF')).toBeUndefined();
    });
  });

  describe('#remove', () => {
    test('should remove a cached key from memory', () => {
      const cache = new Cache();
      cache.set('limelight', 'universal dream');
      expect(cache.get('limelight')).toEqual('universal dream');

      cache.remove('limelight');
      expect(cache.get('limelight')).toBeUndefined();
    });

    test('should remove file for cached key if it was persistent', () => {
      const cache = new Cache({cacheDir: '/tmp/cache/'});
      cache.set(
        'subdivisions',
        'Sprawling on the fringes of the city',
        {persist: true},
      );

      expect(fs.existsSync('/tmp/cache/subdivisions')).toBe(true);
      cache.remove('subdivisions');

      expect(fs.existsSync('/tmp/cache/subdivisions')).toBe(false);
    });

    test('should log a failure when key cannot be removed from memory', () => {
      const debugSpy = jest.fn();
      const cache = new Cache({log: {debug: debugSpy}});
      jest.spyOn(cache, '__del').mockReturnValue(false);
      cache.remove('test');
      const call = debugSpy.mock.calls[0];
      expect(_.includes(call[0], 'Failed')).toBe(true);
      expect(debugSpy).toHaveBeenCalledTimes(2);
    });
  });
});
