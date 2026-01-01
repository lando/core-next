

import {describe, test, expect} from 'bun:test';

import getUsername from '../utils/get-username';

describe('get-username', () => {
  test('should return a string', () => {
    const username = getUsername();
    expect(typeof username).toBe('string');
    expect(username.length).toBeGreaterThan(0);
  });
});
