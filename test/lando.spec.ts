'use strict';

const {describe, expect, test, beforeEach} = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Lando = require('./../.');

const cliMock = {
  confirm: () => {},
  formatOptions: () => {},
  makeArt: () => {},
};

describe('lando', () => {
  beforeEach(() => {
    fs.rmSync('/tmp/cache', {recursive: true, force: true});
  });

  describe('#Lando', () => {
    test('should return a Lando instance with correct default options', () => {
      const lando = new Lando();
      expect(lando).toBeInstanceOf(Lando);
    });

    test('should use prexisting instance id if possible', () => {
      fs.mkdirSync('/tmp/cache', {recursive: true});
      fs.writeFileSync('/tmp/cache/id', '"24601"');
      const lando = new Lando({userConfRoot: '/tmp'});
      expect(lando.config.id).toBe('24601');
      expect(lando.config.user).toBe('24601');
    });

    test('should set and persitent cache an instance id if needed', () => {
      const lando = new Lando({userConfRoot: os.tmpdir()});
      const idPath = path.join(lando.config.userConfRoot, 'cache', 'id');
      expect(fs.existsSync(idPath)).toBe(true);
      expect(lando.cache.get('id')).toBe(lando.config.id);
    });
  });

  describe('#bootstrap', () => {
    test('should return a lando object with the default config', async () => {
      const lando = new Lando({logLevelConsole: 'warn'});
      const result = await lando.bootstrap('config');
      expect(result.config.userConfRoot).toBe(os.tmpdir());
      expect(Array.isArray(result.config.plugins)).toBe(true);
      expect(result.config.plugins.length).toBeGreaterThan(0);
    });

    test('should mix envvars into config with set prefix', async () => {
      process.env.JOURNEY_PRODUCT = 'steveperry';
      process.env.JOURNEY_MODE = 'rocknroll';
      const lando = new Lando({envPrefix: 'JOURNEY'});
      const result = await lando.bootstrap('config');
      expect(result.config.userConfRoot).toBe(os.tmpdir());
      expect(Array.isArray(result.config.plugins)).toBe(true);
      expect(result.config.plugins.length).toBeGreaterThan(0);
      expect(result.config.product).toBe(process.env.JOURNEY_PRODUCT);
      expect(result.config.mode).toBe(process.env.JOURNEY_MODE);
      delete process.env.JOURNEY_PRODUCT;
      delete process.env.JOURNEY_MODE;
    });

    test('should mix config files into config', async () => {
      const srcRoot = path.resolve(__dirname, '..');
      const lando = new Lando({
        configSources: [path.resolve(srcRoot, 'config.yml')],
        pluginDirs: [srcRoot],
      });
      lando.cli = cliMock;
      const result = await lando.bootstrap('config');
      expect(Array.isArray(result.config.plugins)).toBe(true);
      expect(result.config.plugins.length).toBeGreaterThan(0);
      lando.tasks.tasks = [];
    });
  });
});
