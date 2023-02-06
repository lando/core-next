'use strict';

class NoStorage {
  static name = 'no-storage';
  static cspace = 'no-storage';
  static config = {};
  static debug = require('../lib/debug')('@lando/core:no-storage');

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
