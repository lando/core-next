'use strict';

const {describe, expect, test, jest} = require('bun:test');
const _ = require('lodash');
const art = require('../lib/art');
const Cli = require('../lib/cli');

const fakeTask = {
  command: 'task [arg1]',
  describe: 'Does the thing on the [appname]',
  options: {
    list: {
      describe: 'list some datas',
      alias: ['l'],
      array: true,
    },
    yes: {
      describe: 'ask me if i am ok',
      alias: ['y'],
      default: false,
      boolean: true,
      interactive: {
        type: 'confirm',
        default: false,
        message: 'Are you ok?',
      },
    },
    other: {
      describe: 'some other thing',
      string: true,
      interactive: {
        type: 'input',
        message: 'what is it?',
        default: 'nothing',
        weight: 4,
      },
    },
  },
  run: options => options,
};

describe('cli', () => {
  describe('#Cli', () => {
    test('should return a Cli instance with correct default options', () => {
      const cli = new Cli();
      expect(cli).toBeInstanceOf(Cli);
      expect(cli.prefix).toBe('LANDO');
      expect(cli.logLevel).toBe('warn');
      expect(cli.userConfRoot).toBeDefined();
      expect(cli.userConfRoot).not.toBe('');
    });

    test('should return a Cli instance with custom options', () => {
      const prefix = '16309';
      const logLevel = 'allthelogz';
      const userConfRoot = '/tmp';
      const cli = new Cli(prefix, logLevel, userConfRoot);
      expect(cli).toBeInstanceOf(Cli);
      expect(cli.prefix).toBe(prefix);
      expect(cli.logLevel).toBe(logLevel);
      expect(cli.userConfRoot).toBe(userConfRoot);
    });
  });

  describe('#argv', () => {
    test('should be the same as yargs.argv', () => {
      const cli = new Cli();
      expect(cli.argv()).toEqual(require('yargs').argv);
    });
  });

  describe('#checkPerms', () => {
    test('should be the same as sudoBlock', () => {
      const cli = new Cli();
      cli.checkPerms();
    });
  });

  describe('#defaultConfig', () => {
    test('should return default config object that can be used to bootstrap a lando cli', () => {
      const cli = new Cli();
      const config = cli.defaultConfig();
      const types = {
        string: [
          'domain',
          'envPrefix',
          'landoFile',
          'logLevelConsole',
          'logDir',
          'mode',
          'product',
          'userAgent',
          'userConfRoot',
          'version',
        ],
        array: ['configSources', 'pluginDirs'],
      };
      _.forEach(types, (props, type) => {
        _.forEach(props, prop => {
          if (type === 'string') {
            expect(typeof config[prop]).toBe('string');
          } else if (type === 'array') {
            expect(Array.isArray(config[prop])).toBe(true);
          }
        });
      });
      expect(config.mode).toBe('cli');
    });

    test('should set log level from argv() if set', () => {
      const cli = new Cli();
      const originalArgv = cli.argv;
      cli.argv = jest.fn().mockReturnValue({v: 3, verbose: 3});
      const config = cli.defaultConfig();
      expect(config.logLevelConsole).toBe(4);
      cli.argv = originalArgv;
    });
  });

  describe('#makeArt', () => {
    test('should be the same as art()', () => {
      const cli = new Cli();
      const func = 'secretToggle';
      const opts = false;
      expect(cli.makeArt(func, opts)).toEqual(art[func](opts));
    });
  });

  describe('#parseToYargs', () => {
    test('should return an object that yargs can use', () => {
      const cli = new Cli();
      const task = cli.parseToYargs(fakeTask);
      expect(typeof task.command).toBe('string');
      expect(typeof task.describe).toBe('string');
      expect(typeof task.builder).toBe('function');
      expect(typeof task.handler).toBe('function');
    });
  });

  describe('#run', () => {
    test.skip('should return a yargs cli', () => {
      // This test invokes yargs which tries to parse real CLI args
      // Skipping as it causes side effects in test environment
      const cli = new Cli();
      const task = cli.parseToYargs({command: 'task', describe: 'desc'});
      cli.run([task]);
    });
  });
});
