'use strict';

const {afterEach, beforeEach, describe, expect, jest, test} = require('bun:test');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const Plugins = require('./../lib/plugins');

const testPlugin = path.resolve(__dirname, '..', 'examples', 'plugins', 'test-plugin-2', 'index.js');
const testPluginYml = path.resolve(__dirname, '..', 'examples', 'plugins', 'test-plugin-2', 'plugin.yml');

let tempDir;
let searchDirs;

describe('plugins', () => {
  describe('#load', () => {
    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-test-'));
      searchDirs = [
        path.join(tempDir, 'dir1'),
        path.join(tempDir, 'dir2'),
        path.join(tempDir, 'dir3'),
      ];

      searchDirs.forEach(dir => {
        const pluginDir = path.join(dir, 'plugins', 'test');
        fs.mkdirSync(pluginDir, {recursive: true});
        fs.copyFileSync(testPlugin, path.join(pluginDir, 'index.js'));
        if (fs.existsSync(testPluginYml)) {
          fs.copyFileSync(testPluginYml, path.join(pluginDir, 'plugin.yml'));
        } else {
          fs.writeFileSync(path.join(pluginDir, 'plugin.yml'), 'name: test\n');
        }
      });

      delete global.__webpack_require__;
      delete global.__non_webpack_require__;
    });

    test('should use __non_webpack_require__ if __webpack_require__ is a func', () => {
      const plugins = new Plugins();
      const find = plugins.find([path.resolve(__dirname, '..', 'examples', 'plugins')]);
      global.__webpack_require__ = jest.fn();
      global.__non_webpack_require__ = require;
      const data = plugins.load(find[0]);
      expect(typeof data).toBe('object');
      expect(data.data['app-plugin-test']).toBe(true);
      expect(data.name).toBe(find[0].name);
      expect(data.path).toBe(find[0].path);
      expect(data.dir).toBe(find[0].dir);
    });

    test('should use the plugin from the last location it finds it', () => {
      const plugins = new Plugins();
      const find = plugins.find(searchDirs);
      expect(find[0].dir).toMatch(/dir3\/plugins\/test$/);
    });

    test('should push a plugin to the plugin registry after it is loaded', () => {
      const plugins = new Plugins();
      const find = plugins.find(searchDirs);
      global.__webpack_require__ = jest.fn();
      global.__non_webpack_require__ = require;
      plugins.load(find[0]);
      expect(plugins.registry).toHaveLength(1);
    });

    test('should throw an error if dynamic require fails', () => {
      const errorSpy = jest.fn();
      const plugins = new Plugins({
        silly: jest.fn(),
        debug: jest.fn(),
        error: errorSpy,
        verbose: jest.fn(),
      });
      plugins.load({name: 'something'}, 'somewhere', {});
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      if (tempDir) {
        fs.rmSync(tempDir, {recursive: true, force: true});
      }
    });
  });
});
