

import {describe, test, expect} from 'bun:test';

import getHostPath from '../utils/get-host-path';

describe('get-host-path', () => {
  test('should return the correct host path on posix', () => {
    const hostPath = getHostPath('/thing:/stuff');
    expect(hostPath).toBe('/thing');
  });

  test('should return the correct host path on windoze', () => {
    const hostPath = getHostPath('C:\\thing:/stuff');
    expect(hostPath).toBe('C:\\thing');
  });
});
