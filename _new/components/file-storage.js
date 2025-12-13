import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import NodeCache from 'node-cache';
import merge from 'lodash-es/merge.js';

import createDebug from '../lib/debug.js';
import id2key from '../utils/normalize-id2key.js';
import read from '../utils/read-file.js';
import size from '../utils/get-size.js';
import write from '../utils/write-file.js';

/*
 * Creates a new Cache instance.
 */
class FileStorage extends NodeCache {
  static name = 'file-storage';
  static cspace = 'file-storage';
  static debug = createDebug('@lando/devtool:file-storage');
  static config = {
    dir: os.tmpdir(),
    delimiter: '.',
  };

  // @TBD: helper to get key from an id
  static getKey = (id, delimiter = FileStorage.config.delimiter) => id2key(id, delimiter);

  // helper to wipe a storage directory
  static flush(dir, debug = FileStorage.debug) {
    // @TODO: error handle dir?
    fs.rmSync(dir, { recursive: true });
    fs.mkdirSync(dir, { recursive: true });
    debug('flushed file storage at %o', dir);
  }

  constructor({ debug = FileStorage.debug, delimiter = FileStorage.config.delimiter, dir = FileStorage.config.dir } = {}) {
    // Get the nodecache opts
    super();

    // Set some things
    this.debug = debug;
    this.delimiter = delimiter;
    this.dir = dir;

    // Ensure the cache dir exists
    fs.mkdirSync(this.dir, { recursive: true });
  }

  // wipes all keys
  flush() {
    // clear out memcache
    super.flushAll();
    this.debug('flushed mem storage at');

    // clear out file cache
    FileStorage.flush(this.dir, this.debug);
    this.debug('flushed file storage at %o', this.dir);
  }

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
      this.debug('retrieved %o items from mem at key %o', size(memResult), key);
      return memResult;

      // otherwise try to get from file storage
    } else {
      try {
        const data = read(path.join(this.dir, key), { extension: 'json' });
        this.debug('retrieved %o items from file storage at %o', size(data), path.join(this.dir, key));
        this.__set(key, data, 0);
        return data;
      } catch (e) {
        this.debug('file storage cache miss with key %o', key);
      }
    }
  }

  // TBD
  has(id) {
    // get key
    const key = FileStorage.getKey(id);
    // return true if its in the memcache
    if (this.__get(key)) return true;
    // otherwise look for it in file storage
    try {
      return read(path.join(this.dir, key), { extension: 'json' }) ? true : false;
    } catch (e) {
      return false;
    }
  }

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
  }

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
  set(id, data, { persist = true, ttl = 0 } = {}) {
    // get key
    const key = FileStorage.getKey(id);

    // Unsafe cache key patterns
    const patterns = {
      controlRe: /[\x00-\x1f\x80-\x9f]/g, // eslint-disable-line no-control-regex
      illegalRe: /[\/\?<>\\:\*\|":]/g, // eslint-disable-line no-useless-escape
      reservedRe: /^\.+$/,
      windowsReservedRe: /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i,
      windowsTrailingRe: /[\. ]+$/, // eslint-disable-line no-useless-escape
    };
    for (const pattern of Object.values(patterns)) {
      if (key.match(pattern)) throw new Error(`Invalid file-storage key: ${key}`);
    }

    // Try to set cache
    if (this.__set(key, data, ttl)) {
      this.debug('set %o items into mem and file storage at %o', size(data), path.join(this.dir, key));
    } else {
      this.debug('failed to set %o items at key %o', size(data), key);
    }

    // And add to file if we have persistence
    if (persist) write(path.join(this.dir, key), data, { extension: 'json' });
  }

  // @TBD
  update(id, value) {
    // get key
    const key = FileStorage.getKey(id);

    // if its an object then merge and set, otherwise just replace
    if (typeof data === 'object') this.set(key, merge({}, this.get(key), value));
    // otherwise just replace it
    else this.set(key, value);
  }
}

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
export default FileStorage;
