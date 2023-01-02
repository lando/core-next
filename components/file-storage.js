'use strict';

// Modules
const fs = require('fs');
const jsonfile = require('jsonfile');
const path = require('path');

const NodeCache = require('node-cache');

/*
 * Creates a new Cache instance.
 */
class FileStorage extends NodeCache {
  static name = 'file-storage';
  static cspace = 'file-storage';
  static config = {};

  constructor({
    debugspace = FileStorage.config.debugspace,
    dir = FileStorage.config.dir,
  } = {}) {
    // Get the nodecache opts
    super();

    // Set some things
    this.debug = require('debug')(`${debugspace}:@lando/core:file-storage`);
    this.dir = dir;

    // Ensure the cache dir exists
    fs.mkdirSync(this.dir, {recursive: true});
  };

  /**
   * Sets an item in the cache
   *
   * @since 3.0.0
   * @alias lando.cache.set
   * @param {String} key The name of the key to store the data with.
   * @param {Any} data The data to store in the cache.
   * @param {Object} [opts] Options to pass into the cache
   * @param {Boolean} [opts.persist=false] Whether this cache data should persist between processes. Eg in a file instead of memory
   * @param {Integer} [opts.ttl=0] Seconds the cache should live. 0 mean forever.
   * @example
   * // Add a string to the cache
   * lando.cache.set('mykey', 'mystring');
   *
   * // Add an object to persist in the file cache
   * lando.cache.set('mykey', data, {persist: true});
   *
   * // Add an object to the cache for five seconds
   * lando.cache.set('mykey', data, {ttl: 5});
   */
  set(key, data, {persist = true, ttl = 0} = {}) {
    // Unsafe cache key patterns
    const patterns = {
      controlRe: /[\x00-\x1f\x80-\x9f]/g,
      illegalRe: /[\/\?<>\\:\*\|":]/g,
      reservedRe: /^\.+$/,
      windowsReservedRe: /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i,
      windowsTrailingRe: /[\. ]+$/,
    };
    for (const pattern of Object.values(patterns)) {
      if (key.match(pattern)) throw new Error(`Invalid cache key: ${key}`);
    }

    // Try to set cache
    if (this.__set(key, data, ttl)) {
      this.debug('Cached %j with key %o for %o', data, key, {persist, ttl});
    } else {
      this.debug('Failed to cache %o with key %o', data, key);
    }

    // And add to file if we have persistence
    if (persist) jsonfile.writeFileSync(path.join(this.cacheDir, key), data);
  };

  /**
   * Gets an item in the cache
   *
   * @since 3.0.0
   * @alias lando.cache.get
   * @param {String} key The name of the key to retrieve the data.
   * @return {Any} The data stored in the cache if applicable.
   * @example
   * // Get the data stored with key mykey
   * const data = lando.cache.get('mykey');
   */
  get(key) {
    // Get from cache
    const memResult = this.__get(key);

    // Return result if its in memcache
    if (memResult) {
      this.debug('Retrieved from memcache with key %o', key);
      return memResult;
    } else {
      try {
        this.debug('Trying to retrieve from file cache with key %o', key);
        return jsonfile.readFileSync(path.join(this.cacheDir, key));
      } catch (e) {
        this.debug('File cache miss with key %o', key);
      }
    }
  };

  /**
   * Manually remove an item from the cache.
   *
   * @since 3.0.0
   * @alias lando.cache.remove
   * @param {String} key The name of the key to remove the data.
   * @example
   * // Remove the data stored with key mykey
   * lando.cache.remove('mykey');
   */
  remove(key) {
    // Try to get cache
    if (this.__del(key)) this.debug('Removed key %o from memcache.', key);
    else this.debug('Failed to remove key %o from memcache.', key);

    // Also remove file if applicable
    try {
      fs.unlinkSync(path.join(this.cacheDir, key));
    } catch (e) {
      this.debug('No file cache with key %o', key);
    }
  };
};

/*
 * Stores the old get method.
 */
FileStorage.prototype.__get = NodeCache.prototype.get;

/*
 * Stores the old set method.
 */
FileStorage.prototype.__set = NodeCache.prototype.set;

/*
 * Stores the old del method.
 */
FileStorage.prototype.__del = NodeCache.prototype.del;

/*
 * Return the class
 */
module.exports = FileStorage;
