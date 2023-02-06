'use strict';

// Modules
const fs = require('fs');
const jsonfile = require('jsonfile');
const merge = require('lodash/merge');
const path = require('path');

const NodeCache = require('node-cache');

/*
 * Creates a new Cache instance.
 */
class FileStorage extends NodeCache {
  static name = 'file-storage';
  static debug = require('../lib/debug')('@lando/core:file-storage');
  static cspace = 'file-storage';
  static config = {
    dir: require('os').tmpdir(),
    delimiter: '.',
  };

  // @TBD: helper to get key from an id
  static getKey = (id, delimiter = FileStorage.config.delimiter) => {
    // if array then join and return
    if (Array.isArray(id)) return id.join(delimiter);
    // otherwise just return
    return id;
  };

  constructor({
    debug = FileStorage.debug,
    delimiter = FileStorage.config.delimiter,
    dir = FileStorage.config.dir,
  } = {}) {
    // Get the nodecache opts
    super();

    // Set some things
    this.debug = debug;
    this.delimiter = delimiter;
    this.dir = dir;

    // Ensure the cache dir exists
    fs.mkdirSync(this.dir, {recursive: true});
  };

  // wipes all keys
  flush() {
    // clear out memcache
    super.flushAll();
    // if we
    fs.rmSync(this.dir, {recursive: true});
    this.debug('flushed mem and file storage at %o', this.dir);
  };

  /**
   * Gets an item in the cache
   *
   * @since 3.0.0
   * @alias lando.cache.get
   * @param {String} id The name of the key to retrieve the data.
   * @return {Any} The data stored in the cache if applicable.
   * @example
   * // Get the data stored with key mykey
   * const data = lando.cache.get('mykey');
   */
  get(id) {
    // get key
    const key = FileStorage.getKey(id);

    // Get from cache
    const memResult = this.__get(key);

    // Return result if its in memcache
    if (memResult) {
      this.debug('retrieved from memcache with key %o', key);
      return memResult;
    } else {
      try {
        const data = jsonfile.readFileSync(path.join(this.dir, key));
        this.debug('retrieved data from file storage %o with key %o', this.dir, key);
        return data;
      } catch (e) {
        this.debug('file storage cache miss with key %o', key);
      }
    }
  };

  /**
   * Manually remove an item from the cache.
   *
   * @since 3.0.0
   * @alias lando.cache.remove
   * @param {String} id The name of the key to remove the data.
   * @example
   * // Remove the data stored with key mykey
   * lando.cache.remove('mykey');
   */
  remove(id) {
    // get key
    const key = FileStorage.getKey(id);

    // Remove from memcace
    this.__del(key);

    // Also remove file if applicable
    try {
      this.debug('removed key %o from memory and file storage', key);
      fs.unlinkSync(path.join(this.dir, key));
    } catch (e) {
      this.debug('no file storage with key %o', key);
    }
  };

  /**
   * Sets an item in the cache
   *
   * @since 3.0.0
   * @alias lando.cache.set
   * @param {String} id The name of the key to store the data with.
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
  set(id, data, {persist = true, ttl = 0} = {}) {
    // get key
    const key = FileStorage.getKey(id);

    // Unsafe cache key patterns
    const patterns = {
      controlRe: /[\x00-\x1f\x80-\x9f]/g,
      illegalRe: /[\/\?<>\\:\*\|":]/g,
      reservedRe: /^\.+$/,
      windowsReservedRe: /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i,
      windowsTrailingRe: /[\. ]+$/,
    };
    for (const pattern of Object.values(patterns)) {
      if (key.match(pattern)) throw new Error(`Invalid file-storage key: ${key}`);
    }

    // Try to set cache
    if (this.__set(key, data, ttl)) {
      this.debug('stored %j with key %o at %o', data, key, path.join(this.dir, key));
    } else {
      this.debug('failed to store %o with key %o', data, key);
    }

    // And add to file if we have persistence
    if (persist) jsonfile.writeFileSync(path.join(this.dir, key), data);
  };

  // @TBD
  update(id, value) {
    // get key
    const key = FileStorage.getKey(id);

    // if its an object then merge and set, otherwise just replace
    if (typeof data === 'object') this.set(key, merge({}, this.get(key), value));

    // otherwise just replace it
    else this.set(key, value);
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
