'use strict';

const {describe, expect, test} = require('bun:test');

const Daemon = require('./../lib/daemon');
const Log = require('./../lib/logger');

const getDockerExecutable = require('../utils/get-docker-x');

describe('daemon', () => {
  describe('#LandoDaemon', () => {
    test('should return an instance with the correct defaults', () => {
      const daemon = new Daemon();
      expect(daemon.docker).toBe(getDockerExecutable());
      expect(daemon.log).toBeInstanceOf(Log);
      expect(daemon.context).toBe('node');
    });

    test.todo('should set this with the correct things');
  });

  describe('#up', () => {
    test.todo('should emit a pre and post engine-up events');
    test.todo('should resolve with truth if the context is not node and we are on linux');
    test.todo('should attempt to start docker if its not up');
    test.todo('should invoke the docker daemon');
    test.todo('should throw an error if it cannot start docker');
  });

  describe('#down', () => {
    test.todo('should resolve with truth if the context is not node and we are on linux');
    test.todo('should resolve with truth if we are on win32 or darwin');
    test.todo('should try to stop docker if it\'s already up');
    test.todo('should throw an error if it can\'t shut down docker');
  });

  describe('#isUp', () => {
    test.todo('Should return true if docker is running');
    test.todo('Should return false if docker is not running');
  });
});
