'use strict';

const {describe, test, expect} = require('bun:test');

const getUsername = require('../utils/get-username');

describe('get-username', () => {
  test('should return a string', () => {
    const username = getUsername();
    expect(typeof username).toBe('string');
    expect(username.length).toBeGreaterThan(0);
  });
});
