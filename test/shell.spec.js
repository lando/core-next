'use strict';

const {describe, test, expect, beforeEach, afterEach, jest} = require('bun:test');
const _ = require('lodash');
const _shell = require('shelljs');
const child = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Shell = require('./../lib/shell');

let tempDir;

const errorCode = cmd => {
  return !_.includes(cmd, 'bomb') ? 0 : _.random(1, 666);
};

const fakeSpawn = (cmd, args) => {
  const command = cmd + ' ' + args.join(' ');
  return {
    connected: !_.includes(command, 'van the man'),
    stdout: {on: (type, fn) => {
        fn(Buffer.from('SPAWN: ' + command, 'utf8'));
      },
    },
    stderr: {on: (type, fn) => {
        fn(Buffer.from('', 'utf8'));
      },
    },
    on: (type, fn) => {
      if (type === 'error') fn(Buffer.from('ERROR', 'utf8'));
      else if (type === 'close') fn(errorCode(command));
    },
  };
};

const fakeExec = (cmd, opts, resolve) => {
  resolve(errorCode(cmd), 'EXEC: ' + cmd, '');
};

describe('shell', () => {
  describe('#Shell', () => {
    test('should return a Shell instance with correct default options', () => {
      const shell = new Shell();
      expect(shell).toBeInstanceOf(Object);
      expect(shell).toHaveProperty('log');
    });
  });

  describe('#sh', () => {
    test('should use shelljs.exec when mode is exec and detached is false', async () => {
      const shell = new Shell();
      const originalExec = _shell.exec;
      _shell.exec = fakeExec;
      try {
        const result = await shell.sh(['slip', 'sliding', 'away']);
        expect(result).toBe('EXEC: slip sliding away');
      } finally {
        _shell.exec = originalExec;
      }
    });

    test('should use child_process.spawn when mode is not exec or detached is true', async () => {
      const shell = new Shell();
      const originalSpawn = child.spawn;
      child.spawn = fakeSpawn;
      try {
        for (const opts of [{mode: 'collect'}, {detached: true}]) {
          const result = await shell.sh(['tupelo', 'honey', 'baby'], opts);
          expect(result).toBe('SPAWN: tupelo honey baby');
        }
      } finally {
        child.spawn = originalSpawn;
      }
    });

    test('should reject on a non zero code with stderr as the message', async () => {
      const shell = new Shell();
      const originalSpawn = child.spawn;
      child.spawn = fakeSpawn;
      try {
        let rejected = false;
        try {
          await shell.sh(['set', 'us', 'up', 'the', 'bomb'], {mode: 'attach'});
        } catch (err) {
          rejected = true;
          expect(err).toBeDefined();
        }
        expect(rejected).toBe(true);
      } finally {
        child.spawn = originalSpawn;
      }
    });

    test('should resolve immediately when detached is true and run.connected is false', async () => {
      const shell = new Shell();
      const originalSpawn = child.spawn;
      child.spawn = fakeSpawn;
      try {
        const result = await shell.sh(['van', 'the', 'man'], {detached: true});
        expect(result).toBeDefined();
      } finally {
        child.spawn = originalSpawn;
      }
    });

    test('should ignore stdin and pipe stdout and stderr when process.lando is not node', async () => {
      const shell = new Shell();
      process.lando = 'browser';
      const originalSpawn = child.spawn;
      child.spawn = (cmd, args, opts) => {
        expect(opts.stdio[0]).toBe('ignore');
        expect(opts.stdio[1]).toBe('pipe');
        expect(opts.stdio[2]).toBe('pipe');
        return {
          stdout: {on: jest.fn()},
          stderr: {on: jest.fn()},
          on: (type, fn) => {
            if (type === 'close') fn(0);
          },
        };
      };
      try {
        await shell.sh(['van', 'the', 'man'], {mode: 'attach'});
      } finally {
        child.spawn = originalSpawn;
        delete process.lando;
      }
    });

    test('should inherit stdio when process.lando is node', async () => {
      const shell = new Shell();
      process.lando = 'node';
      const originalSpawn = child.spawn;
      child.spawn = (cmd, args, opts) => {
        expect(opts.stdio).toBe('inherit');
        return {
          stdout: {on: jest.fn()},
          on: (type, fn) => {
            if (type === 'close') fn(0);
          },
        };
      };
      try {
        await shell.sh(['van', 'the', 'man'], {mode: 'attach'});
      } finally {
        child.spawn = originalSpawn;
        delete process.lando;
      }
    });
  });

  describe('#which', () => {
    const savePath = process.env.PATH;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-shell-test-'));
      process.env.PATH = tempDir;
      const binPath = path.join(tempDir, 'GORILLA.BAS');
      fs.writeFileSync(binPath, 'Gorillaz on buildings');
      fs.chmodSync(binPath, 0o755);
    });

    test('should return the same as shelljs.which', () => {
      const shell = new Shell();
      const which1 = shell.which('GORILLA.BAS');
      const which2 = _shell.which('GORILLA.BAS');
      expect(_.toString(which1)).toBe(_.toString(which2));
    });

    test('should return null if command is not found', () => {
      const shell = new Shell();
      const wolfenstein = shell.which('WOLFENSTEIN2D.exe');
      expect(wolfenstein).toBeNull();
    });

    afterEach(() => {
      process.env.PATH = savePath;
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, {recursive: true, force: true});
      }
    });
  });
});
