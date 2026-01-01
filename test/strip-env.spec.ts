

import {describe, test, expect} from 'bun:test';
import stripEnv from '../utils/strip-env';

describe('strip-env', () => {
  test('should return process.env stripped of all keys that start with prefix', () => {
    process.env.DANCE_NOW = 'everybody';
    const result = stripEnv('DANCE');
    expect(typeof result).toBe('object');
    expect(result).not.toHaveProperty('DANCE_NOW');
    expect(process.env).not.toHaveProperty('DANCE_NOW');
  });
});
