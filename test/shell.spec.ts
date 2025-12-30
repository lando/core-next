'use strict';

const {describe, test, expect, beforeEach, afterEach} = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Shell = require('./../lib/shell');

let tempDir: string;

describe('shell', () => {
  describe('#Shell', () => {
    test('should return a Shell instance with correct default options', () => {
      const shell = new Shell();
      expect(shell).toBeInstanceOf(Object);
      expect(shell).toHaveProperty('log');
    });
  });

  describe('#sh', () => {
    test('should execute a command and return stdout', async () => {
      const shell = new Shell();
      const result = await shell.sh(['echo', 'hello world']);
      expect(result.trim()).toBe('hello world');
    });

    test('should reject on a non-zero exit code', async () => {
      const shell = new Shell();
      let threw = false;
      try {
        await shell.sh(['false']);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    test.todo('should use child_process.spawn when mode is not exec or detached is true');
    test.todo('should ignore stdin and pipe stdout and stderr when process.lando is not node');
    test.todo('should inherit stdio when process.lando is node');
  });

  describe('#which', () => {
    const savePath = process.env.PATH;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lando-shell-test-'));
    });

    test('should return null if command is not found', () => {
      const shell = new Shell();
      const wolfenstein = shell.which('WOLFENSTEIN2D_NONEXISTENT_12345.exe');
      expect(wolfenstein).toBeNull();
    });

    test('should return path to common executables', () => {
      const shell = new Shell();
      const result = shell.which('ls');
      expect(result).not.toBeNull();
      expect(typeof result).toBe('string');
    });

    afterEach(() => {
      process.env.PATH = savePath;
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, {recursive: true, force: true});
      }
    });
  });
});
