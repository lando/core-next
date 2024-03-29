'use strict';

// Modules
const id2key = require('../utils/normalize-id2key');

class NoStorage {
  static name = 'no-storage';
  static cspace = 'no-storage';
  static debug = require('../lib/debug')('@lando/core:no-storage');
  static config = {
    delimiter: '.',
  };

  // @TBD: helper to get key from an id
  static getKey = (id, delimiter = NoStorage.config.delimiter) => id2key(id, delimiter = NoStorage.config.delimiter);

  // helper to wipe a storage directory
  static flush(dir, debug = NoStorage.debug) {}

  constructor({debug = NoStorage.debug} = {}) {
    this.debug = debug;
  }

  /*
   * Gets an item in the cache
   */
  get(key) {
    this.debug('caching disabled and/or using no storage backend so did not get key %o', id2key(key));
  }

  /*
   * Manually remove an item from the cache.
   */
  remove(key) {
    this.debug('caching disabled and/or using no storage backend so did not remove key %o', id2key(key));
  }

  // @TDB
  has(key) {
    return false;
  }

  /*
   * Sets an item in the cache
   */
  set(key, data) {
    this.debug('caching disabled and/or using no storage backend so did not set key %o', id2key(key));
  }

  // @TBD
  update(key, value) {
    this.debug('caching disabled and/or using no storage backend so did not update key %o', id2key(key));
  }
}

/*
 * Return the class
 */
module.exports = NoStorage;
