'use strict';

const {describe, expect, test, beforeEach, afterEach, jest} = require('bun:test');
const _ = require('lodash');
const axios = require('axios');
const Promise = require('../lib/promise');

describe('legacy-scan', () => {
  let originalCreate;

  beforeEach(() => {
    const counter = {};
    originalCreate = axios.create;
    axios.create = jest.fn(() => ({
      get: url => {
        counter[url] = counter[url] + 1 || 0;
        const last = _.last(url.split('.'));
        let code = 200;
        if (_.includes(last, ':')) {
          if (_.toInteger(last.split(':')[1]) === counter[url]) code = 200;
          else code = last.split(':')[0];
        } else {
          code = isFinite(_.last(url.split('.'))) ? _.last(url.split('.')) : 200;
        }
        return (_.startsWith(code, 2)) ? Promise.resolve() : Promise.reject({response: {status: _.toInteger(code)}});
      },
    }));
  });

  afterEach(() => {
    axios.create = originalCreate;
  });

  test('should return "good" status objects on status code 2xx', async () => {
    const scan = require('../utils/legacy-scan')();
    const urls = ['http://www.thecultofscottbakula.com', 'http://anumalak.com:'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });

  test('should return "good" status objects on non-wait codes', async () => {
    const scan = require('../utils/legacy-scan')();
    const urls = ['http://thecultofscottbakula.com:503', 'http://anumalak.com:503'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });

  test('should return "ok" status objects on wildcard entries', async () => {
    const scan = require('../utils/legacy-scan')();
    const urls = ['http://*.thecultofscottbakula.com', 'http://*.anumalak.com:'];
    const results = await scan(urls);
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('yellow');
    }
  });

  test('should return "bad" status objects on wait codes that don\'t change after max retries', async () => {
    const scan = require('../utils/legacy-scan')();
    const urls = ['http://thecultofscottbakula.com.666', 'http://anumalak.com.404'];
    const results = await scan(urls, {max: 1, waitCodes: [666, 404]});
    for (const result of results) {
      expect(result.status).toBe(false);
      expect(result.color).toBe('red');
    }
  });

  test('should return "good" status objects on wait codes that become non-wait codes after retry', async () => {
    const scan = require('../utils/legacy-scan')();
    const urls = ['http://thecultofscottbakula.com.666:2'];
    const results = await scan(urls, {max: 2, waitCodes: [666]});
    for (const result of results) {
      expect(result.status).toBe(true);
      expect(result.color).toBe('green');
    }
  });
});
