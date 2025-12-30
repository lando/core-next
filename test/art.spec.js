'use strict';

const _ = require('lodash');
const art = require('../lib/art');
const {describe, expect, test} = require('bun:test');

describe('art', () => {
  test('should return an object', () => {
    expect(typeof art).toBe('object');
  });

  _.forEach(_.keys(art), key => {
    test(`it should run ${key} without an error and return a string`, () => {
      const result = art[key]();
      expect(typeof result).toBe('string');
    });
  });
});
