import createDebug from '../lib/debug.js';
import id2key from '../utils/normalize-id2key.js';

class NoStorage {
  static name = 'no-storage';
  static cspace = 'no-storage';
  static debug = createDebug('@lando/devtool:no-storage');
  static config = {
    delimiter: '.',
  };

  // @TBD: helper to get key from an id
  static getKey = (id, delimiter = NoStorage.config.delimiter) => id2key(id, delimiter);

  // helper to wipe a storage directory
  static flush() {}

  constructor({ debug = NoStorage.debug } = {}) {
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
  has() {
    return false;
  }

  /*
   * Sets an item in the cache
   */
  set(key) {
    this.debug('caching disabled and/or using no storage backend so did not set key %o', id2key(key));
  }

  // @TBD
  update(key) {
    this.debug('caching disabled and/or using no storage backend so did not update key %o', id2key(key));
  }
}

/*
 * Return the class
 */
export default NoStorage;
