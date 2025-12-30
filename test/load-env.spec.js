'use strict';

const {describe, expect, test} = require('bun:test');

const loadEnvs = require('../utils/load-env');

describe('load-env', () => {
  test('should return an object built from all keys from process.env that start with a given prefix', () => {
    process.env.DANCE_NOW = 'everybody';
    const result = loadEnvs('DANCE');
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('now');
    expect(result.now).toBe(process.env.DANCE_NOW);
  });
});
