'use strict';

const {describe, expect, test} = require('bun:test');

const user = require('./../lib/user');

describe('user', () => {
  describe('#getUid', () => {
    test('should return a uid', () => {
      const uid = user.getUid();
      expect(typeof uid).toBe('string');
    });
  });
  describe('#getGid', () => {
    test('should return a gid', () => {
      const gid = user.getGid();
      expect(typeof gid).toBe('string');
    });
  });
  describe('#getUsername', () => {
    test('should return a username', () => {
      const username = user.getUsername();
      expect(typeof username).toBe('string');
    });
  });
});
