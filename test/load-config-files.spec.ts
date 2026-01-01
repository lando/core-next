

import {describe, expect, test, beforeEach, afterEach} from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import hasher from 'object-hash';

import loadFiles from '../utils/load-config-files';

let tempDir;

describe('load-config-files', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-config-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  test('should return an empty object if no files are specified', () => {
    const fileConfig = loadFiles();
    expect(Object.keys(fileConfig).length).toBe(0);
  });

  test('should return data only from files that exist', () => {
    const configPath = path.join(tempDir, 'config1.yml');
    fs.writeFileSync(configPath, 'obiwan: kenobi');
    const fileConfig = loadFiles([configPath, path.join(tempDir, 'doesnotexist.yml')]);
    expect(hasher(fileConfig)).toBe(hasher({obiwan: 'kenobi'}));
  });

  test('should give priority to the last file loaded', () => {
    const config1Path = path.join(tempDir, 'config1.yml');
    const config2Path = path.join(tempDir, 'config2.yml');
    fs.writeFileSync(config1Path, 'scoundrel: lando');
    fs.writeFileSync(config2Path, 'scoundrel: solo');
    const fileConfig = loadFiles([config1Path, config2Path]);
    expect(hasher(fileConfig)).toBe(hasher({scoundrel: 'solo'}));
  });
});
