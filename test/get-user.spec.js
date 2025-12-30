'use strict';

const {describe, expect, test} = require('bun:test');

const getUser = require('../utils/get-user');

describe('get-user', () => {
  test('should return "www-data" if no matching service is found', () => {
    const info = [{service: 'not-matching'}];
    expect(getUser('test-service', info)).toBe('www-data');
  });

  test('should return "www-data" for a "no-api" docker-compose service', () => {
    const info = [{service: 'test-service', type: 'docker-compose'}];
    expect(getUser('test-service', info)).toBe('www-data');
  });

  test('should return "www-data" if service.api is 4 but no user is specified', () => {
    const info = [{service: 'test-service', api: 4}];
    expect(getUser('test-service', info)).toBe('www-data');
  });

  test('should return specified user if service.api is 4 and user is specified', () => {
    const info = [{service: 'test-service', api: 4, user: 'custom-user'}];
    expect(getUser('test-service', info)).toBe('custom-user');
  });

  test('should return "www-data" if service.api is not 4 and no meUser is specified', () => {
    const info = [{service: 'test-service', api: 3}];
    expect(getUser('test-service', info)).toBe('www-data');
  });

  test('should return specified meUser if service.api is not 4 and meUser is specified', () => {
    const info = [{service: 'test-service', api: 3, meUser: 'custom-meUser'}];
    expect(getUser('test-service', info)).toBe('custom-meUser');
  });
});
