'use strict';

const {describe, test, expect, beforeEach, afterEach} = require('bun:test');
const fs = require('fs');
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

const getComposeExecutable = require('../utils/get-compose-x');

describe('get-compose-x', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
  });

  afterEach(() => {
    resetPlatform();
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  test('should return the correct lando-provided path on linux when executable exists', () => {
    setPlatform('linux');
    const binPath = path.join(tempDir, 'bin');
    fs.mkdirSync(binPath, {recursive: true});
    const composePath = path.join(binPath, 'docker-compose');
    fs.writeFileSync(composePath, 'CODEZ');
    fs.chmodSync(composePath, 0o755);

    const oldLandoBin = process.env.LANDO_COMPOSE_BIN;
    process.env.LANDO_COMPOSE_BIN = composePath;

    try {
      const composeExecutable = getComposeExecutable();
      expect(typeof composeExecutable).toBe('string');
    } finally {
      if (oldLandoBin) {
        process.env.LANDO_COMPOSE_BIN = oldLandoBin;
      } else {
        delete process.env.LANDO_COMPOSE_BIN;
      }
    }
  });

  test('should return a string path', () => {
    const composeExecutable = getComposeExecutable();
    expect(typeof composeExecutable).toBe('string');
  });

  test('should return a valid path object when parsed', () => {
    const composeExecutable = getComposeExecutable();
    expect(typeof path.parse(composeExecutable)).toBe('object');
  });
});
