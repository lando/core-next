'use strict';

const {describe, expect, test, beforeEach, afterEach, jest} = require('bun:test');

const UpdateManager = require('./../lib/updates');
const updates = new UpdateManager();

describe('updates', () => {
  describe('#updateAvailable', () => {
    test('should return true if version 1 is less than version 2', () => {
      expect(updates.updateAvailable('3.0.0', '3.0.1')).toBe(true);
      expect(updates.updateAvailable('3.0.1', '3.0.1')).toBe(false);
    });

    test('should handle non-numeric eg "beta" versions', () => {
      expect(updates.updateAvailable('3.0.0-beta.1', '3.0.0-beta.2')).toBe(true);
      expect(updates.updateAvailable('3.0.0-beta.2', '3.0.0-beta.2')).toBe(false);
    });

    test('should understand the prerelease hierarchy', () => {
      expect(updates.updateAvailable('3.0.0-alpha.1', '3.0.0-beta.1')).toBe(true);
      expect(updates.updateAvailable('3.0.0-alpha.1', '3.0.0-rc.1')).toBe(true);
      expect(updates.updateAvailable('3.0.0-alpha.1', '3.0.0-rrc.1')).toBe(true);
      expect(updates.updateAvailable('3.0.0-beta.1', '3.0.0-rc.1')).toBe(true);
      expect(updates.updateAvailable('3.0.0-rc.1', '3.0.0-rrc.1')).toBe(true);
      expect(updates.updateAvailable('3.0.0-beta.1', '3.0.0-rrc.1')).toBe(true);

      expect(updates.updateAvailable('3.0.0-rrc.1', '3.0.0-alpha.1')).toBe(false);
      expect(updates.updateAvailable('3.0.0-rrc.1', '3.0.0-beta.1')).toBe(false);
      expect(updates.updateAvailable('3.0.0-rrc.1', '3.0.0-rc.1')).toBe(false);
      expect(updates.updateAvailable('3.0.0-beta.1', '3.0.0-alpha.1')).toBe(false);
      expect(updates.updateAvailable('3.0.0-rc.1', '3.0.0-alpha.1')).toBe(false);
      expect(updates.updateAvailable('3.0.0-rc.1', '3.0.0-beta.1')).toBe(false);
    });
  });

  describe('#fetch', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should return true if data is undefined', () => {
      expect(updates.fetch()).toBe(true);
    });

    test('should return whether we need to check for updates again', () => {
      jest.setSystemTime(new Date('October 26, 1985 01:35:00'));
      expect(updates.fetch({expires: new Date('November 5, 1955, 06:15:00')})).toBe(true);
      expect(updates.fetch({expires: new Date('October 21, 2015, 16:29:00')})).toBe(false);
    });
  });
});
