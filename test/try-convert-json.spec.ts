

import {describe, test, expect} from 'bun:test';
import tryConvertJson from '../utils/try-convert-json';

describe('try-convert-json', () => {
  test('should return the unaltered input if input is not a parsable JSON string', () => {
    const input = 'obiwan';
    const result = tryConvertJson(input);
    expect(typeof result).toBe('string');
    expect(result).toBe(input);
  });

  test('should return an object if input is a parsable JSON string representing an object', () => {
    const input = '{}';
    const result = tryConvertJson(input);
    expect(typeof result).toBe('object');
  });

  test('should return an array if input is a parsable JSON string representing an array', () => {
    const input = '[]';
    const result = tryConvertJson(input);
    expect(Array.isArray(result)).toBe(true);
  });
});
