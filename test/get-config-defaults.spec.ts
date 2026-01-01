

import {describe, test, expect} from 'bun:test';
import _ from 'lodash';
import hasher from 'object-hash';

import getConfigDefaults from '../utils/get-config-defaults';

describe('get-config-defaults', () => {
  test('should return a properly structured default config object', () => {
    const defaults = getConfigDefaults();
    expect(_.hasIn(defaults, 'orchestratorBin')).toBe(false);
    expect(_.hasIn(defaults, 'orchestratorVersion')).toBe(true);
    expect(_.hasIn(defaults, 'orchestratorSeparator')).toBe(true);
    expect(_.hasIn(defaults, 'configSources')).toBe(true);
    expect(_.hasIn(defaults, 'dockerBin')).toBe(true);
    expect(_.hasIn(defaults, 'dockerBinDir')).toBe(true);
    expect(_.hasIn(defaults, 'env')).toBe(true);
    expect(_.hasIn(defaults, 'home')).toBe(true);
    expect(_.hasIn(defaults, 'logLevel')).toBe(true);
    expect(_.hasIn(defaults, 'node')).toBe(true);
    expect(_.hasIn(defaults, 'os')).toBe(true);
    expect(_.hasIn(defaults, 'os.type')).toBe(true);
    expect(_.hasIn(defaults, 'os.platform')).toBe(true);
    expect(_.hasIn(defaults, 'os.release')).toBe(true);
    expect(_.hasIn(defaults, 'os.arch')).toBe(true);
    expect(_.hasIn(defaults, 'plugins')).toBe(true);
    expect(_.hasIn(defaults, 'process')).toBe(true);
    expect(_.hasIn(defaults, 'userConfRoot')).toBe(true);
    expect(_.get(defaults, 'orchestratorSeparator')).toBe('_');
    expect(Array.isArray(_.get(defaults, 'configSources'))).toBe(true);
  });

  test('should mirror process.env', () => {
    const env = getConfigDefaults().env;
    expect(hasher(env)).toBe(hasher(process.env));
    process.env.NEW = 'things';
    expect(hasher(env)).toBe(hasher(process.env));
    delete process.env.NEW;
    expect(hasher(env)).toBe(hasher(process.env));
    env.NEW2 = 'morethings';
    expect(hasher(env)).toBe(hasher(process.env));
    delete env.NEW2;
    expect(hasher(env)).toBe(hasher(process.env));
  });

  test('config.process should return "browser" if in a browser', () => {
    process.versions.chrome = 'test';
    const processType = getConfigDefaults().process;
    expect(processType).toBe('browser');
    delete process.versions.chrome;
  });

  test('config.process should return "node" if not in a browser', () => {
    delete process.versions.chrome;
    delete process.versions.electron;
    delete process.versions['atom-shell'];
    const processType = getConfigDefaults().process;
    expect(processType).toBe('node');
  });
});
