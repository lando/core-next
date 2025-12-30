'use strict';

const {describe, test, expect, beforeEach, afterEach} = require('bun:test');
const _ = require('lodash');
const _shell = require('shelljs');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Shell = require('./../lib/shell');

let tempDir: string;

const fakeExec = (cmd: string, opts: object, resolve: (code: number, stdout: string, stderr: string) => void) => {
  const errorCode = !_.includes(cmd, 'bomb') ? 0 : _.random(1, 666);
  resolve(errorCode, 'EXEC: ' + cmd, '');
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

    test.todo('should use child_process.spawn when mode is not exec or detached is true');
    test.todo('should reject on a non zero code with stderr as the message');
    test.todo('should resolve immediately when detached is true and run.connected is false');
    test.todo('should ignore stdin and pipe stdout and stderr when process.lando is not node');
    test.todo('should inherit stdio when process.lando is node');
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
