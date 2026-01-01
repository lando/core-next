

import {describe, test, expect} from 'bun:test';

const originalPlatform = process.platform;

const setPlatform = function(platform) {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = function() {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

import getUid from '../utils/get-uid';

describe('get-uid', () => {
  test('should return user 1000 on Windows', () => {
    setPlatform('win32');
    const uid = getUid();
    expect(uid).toBe('1000');
    expect(typeof uid).toBe('string');
    expect(isFinite(uid)).toBe(true);
    resetPlatform();
  });

  test('should return a uid when no argument is specified', () => {
    const uid = getUid();
    expect(typeof uid).toBe('string');
    expect(isFinite(uid)).toBe(true);
  });

  test('should return uid as a string', () => {
    const uid = getUid();
    expect(typeof uid).toBe('string');
  });
});
