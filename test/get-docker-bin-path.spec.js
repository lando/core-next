'use strict';

const {describe, test, expect, afterEach} = require('bun:test');
const path = require('path');

const originalPlatform = process.platform;

const setPlatform = platform => {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = () => {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

const getDockerBinPath = require('./../utils/get-docker-bin-path');

describe('get-docker-bin-path', () => {
  afterEach(() => {
    resetPlatform();
  });

  test('should return the correct lando-provided path on win32', () => {
    setPlatform('win32');
    process.env.ProgramW6432 = 'C:\\Program Files';
    const dockerBinPath = getDockerBinPath();
    const pf = process.env.ProgramW6432;
    const value = path.win32.join(pf, 'Docker', 'Docker', 'resources', 'bin');
    expect(dockerBinPath).toBe(value);
    delete process.env.ProgramW6432;
  });

  test('should fallback to the ProgramFiles path on win32', () => {
    setPlatform('win32');
    const holder = process.env.ProgramW6432;
    process.env.ProgramFiles = 'C:\\Program Files';
    delete process.env.ProgramW6432;
    const dockerBinPath = getDockerBinPath();
    const pf = process.env.ProgramFiles;
    const value = path.win32.join(pf, 'Docker', 'Docker', 'resources', 'bin');
    expect(dockerBinPath).toBe(value);
    process.env.ProgramW6432 = holder;
    delete process.env.ProgramFiles;
  });

  test('should return the correct lando-provided path on linux', () => {
    setPlatform('linux');
    const dockerBinPath = getDockerBinPath();
    expect(dockerBinPath).toBe('/usr/share/lando/bin');
  });

  test('should return the correct lando-provided path on darwin', () => {
    setPlatform('darwin');
    const dockerBinPath = getDockerBinPath();
    expect(dockerBinPath).toBe('/Applications/Docker.app/Contents/Resources/bin');
  });
});
