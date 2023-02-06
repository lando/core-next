'use strict';

// Modules
const fs = require('fs');

class NoStorage {
  static name = 'no-storage';
  static cspace = 'no-storage';
  static debug = require('../lib/debug')('@lando/core:no-storage');

  // helper to wipe a storage directory
  static flush(dir, debug = NoStorage.debug) {
    // @TODO: error handle dir?
    fs.rmSync(dir, {recursive: true});
    debug('flushed file storage at %o', dir);
  };

  constructor({debug = FileStorage.debug} = {}) {
    this.debug = debug;
  };

  /*
   * Sets an item in the cache
   */
  set(key, data) {
    this.debug('did not store key %o', key);
  };

  /*
   * Gets an item in the cache
   */
  get(key) {
    this.debug('did not get key %o', key);
  };

  /*
   * Manually remove an item from the cache.
   *
   */
  remove(key) {
    this.debug('did not remove key %o', key);
  };

  // @TBD
  update(key, value) {
    this.debug('did not update key %o', key);
  };
};

/*
 * Return the class
 */
module.exports = NoStorage;
