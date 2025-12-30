'use strict';

const {describe, test, expect} = require('bun:test');

const originalPlatform = process.platform;

const setPlatform = function(platform) {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = function() {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

const getGid = require('../utils/get-uid');

describe('get-gid', () => {
  test('should return group 1000 on Windows', () => {
    setPlatform('win32');
    const gid = getGid();
    expect(gid).toBe('1000');
    expect(typeof gid).toBe('string');
    expect(isFinite(gid)).toBe(true);
    resetPlatform();
  });

  test('should return a gid when no argument is specified', () => {
    const gid = getGid();
    expect(typeof gid).toBe('string');
    expect(isFinite(gid)).toBe(true);
  });

  test('should return gid as a string', () => {
    const gid = getGid();
    expect(typeof gid).toBe('string');
  });
});
