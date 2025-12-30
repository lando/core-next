'use strict';

const {describe, test, expect, afterEach, beforeEach} = require('bun:test');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const originalPlatform = process.platform;
let tempDir;

const setPlatform = platform => {
  Object.defineProperty(process, 'platform', {value: platform});
};
const resetPlatform = () => {
  Object.defineProperty(process, 'platform', {value: originalPlatform});
};

const getDockerExecutable = require('../utils/get-docker-x');

describe('get-docker-x', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
  });

  afterEach(() => {
    resetPlatform();
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  test('should return the normal system path on linux when docker exists', () => {
    setPlatform('linux');
    if (fs.existsSync('/usr/bin/docker')) {
      const dockerExecutable = getDockerExecutable();
      expect(dockerExecutable).toBe('/usr/bin/docker');
    } else {
      const dockerExecutable = getDockerExecutable();
      expect(typeof dockerExecutable).toBe('string');
    }
  });

  test('should return a string path for docker executable', () => {
    const dockerExecutable = getDockerExecutable();
    expect(typeof dockerExecutable).toBe('string');
    expect(dockerExecutable.length).toBeGreaterThan(0);
  });

  test('should return a path that can be parsed', () => {
    const dockerExecutable = getDockerExecutable();
    const parsed = path.parse(dockerExecutable);
    expect(typeof parsed).toBe('object');
    expect(parsed.base).toContain('docker');
  });
});
