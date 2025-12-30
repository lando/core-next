'use strict';

const {describe, expect, test} = require('bun:test');
const os = require('os');
const path = require('path');

const normalizePath = require('../utils/normalize-path');

describe('#normalize-path', () => {
  test('should return itself if it starts with $', () => {
    const local = ['$LANDO_APP_ROOT', 'directory'].join(path.sep);
    const base = path.sep + 'anything';
    const normalized = normalizePath(local, base);

    expect(normalized).toBe(local);
  });

  test('should return itself if it is one of the excludes', () => {
    const local = 'nfsmount';
    const base = path.sep + 'anything';
    const excludes = ['nfsmount'];
    const normalized = normalizePath(local, base, excludes);

    expect(normalized).toBe(local);
  });

  test('should return itself if it is an absolute path', () => {
    const local = [os.tmpdir(), 'test'].join(path.sep);
    const base = path.sep + 'anything';
    const normalized = normalizePath(local, base);

    expect(normalized).toBe(local);
  });

  test('should return an absolute path resolved by base if it is a relative path', () => {
    const local = ['.', '..', 'thing'].join(path.sep);
    const prefix = (process.platform === 'win32') ? 'C:\\' : '/';
    const base = prefix + ['anything', 'thing'].join(path.sep);
    const normalized = normalizePath(local, base);

    expect(normalized).toBe(prefix + ['anything', 'thing'].join(path.sep));
    expect(path.isAbsolute(normalized)).toBe(true);
  });
});
