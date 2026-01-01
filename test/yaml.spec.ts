

import {describe, expect, test, beforeEach, afterEach} from 'bun:test';
import fs from 'fs-extra';
import hasher from 'object-hash';
import os from 'os';
import path from 'path';
import Yaml from './../lib/yaml';

let tempDir;

describe('yaml', () => {
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
  });

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, {recursive: true, force: true});
    }
  });

  describe('#Yaml', () => {
    test('should return a Yaml instance with correct default options', () => {
      const yaml = new Yaml();
      expect(yaml).toBeInstanceOf(Object);
      expect(yaml).toHaveProperty('log');
    });
  });

  describe('#load', () => {
    test('should return data from a YAML file as an Object', () => {
      const yaml = new Yaml();
      const content = ['obiwan: kenobi', 'qui:', '- gon', '- jinn'].join(os.EOL);
      const configFile = path.join(tempDir, 'config1.yml');
      fs.writeFileSync(configFile, content);
      const data = yaml.load(configFile);
      expect(typeof data).toBe('object');
      expect(hasher(data)).toEqual(hasher({obiwan: 'kenobi', qui: ['gon', 'jinn']}));
    });

    test('should throw an error when file does not exist', () => {
      const yaml = new Yaml({error: () => {
        throw Error();
      }});
      const bogusville = path.join(tempDir, 'thisalmostcertainlydoesnotexist-3285-2385.yml');
      expect(() => yaml.load(bogusville)).toThrow(Error);
    });
  });

  describe('#dump', () => {
    test('should create the directory for the file if it does not exist', () => {
      const yaml = new Yaml();
      const testFile = path.join(tempDir, 'subdir', 'file.yml');
      yaml.dump(testFile);
      expect(fs.existsSync(path.dirname(testFile))).toBe(true);
    });

    test('should write a valid YAML file to disk for the object', () => {
      const yaml = new Yaml();
      const data = {obiwan: 'kenobi', qui: ['gon', 'jinn']};
      const testFile = path.join(tempDir, 'file.yml');
      yaml.dump(testFile, data);
      expect(fs.existsSync(testFile)).toBe(true);
      expect(hasher(yaml.load(testFile))).toEqual(hasher(data));
    });

    test('should return the name of the file', () => {
      const yaml = new Yaml();
      const testFile = path.join(tempDir, 'file.yml');
      const file = yaml.dump(testFile, {});
      expect(file).toBe(testFile);
    });
  });
});
