'use strict';

const {describe, test, expect} = require('bun:test');

const getHostPath = require('../utils/get-host-path');

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
