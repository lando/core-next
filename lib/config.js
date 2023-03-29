'use strict';

// modz
const encode = require('../utils/encode');
const decodeKeys = require('../utils/decode-keys');
const encodeKeys = require('../utils/encode-keys');
const fs = require('fs');
const get = require('lodash/get');
const has = require('lodash/has');
const isObject = require('lodash/isPlainObject');
const nconf = require('nconf');
const merge = require('lodash/mergeWith');
const mergeArrays = require('../utils/merge-arrays');
const read = require('../utils/read-file');
const set = require('lodash/set');
const unset = require('lodash/unset');
const write = require('../utils/write-file');
const yaml = require('yaml');

const {basename, dirname, extname} = require('path');

// custom yml/yaml formatter
['yaml', 'yml'].forEach(format => {
  nconf.formats[format] = {
    parse: (obj, options) => yaml.parse(obj, options),
    stringify: (obj, options) => yaml.stringify(obj, options),
  };
});

/*
 * Creates a new Config instance.
 */
class Config extends nconf.Provider {
  static id = 'config';
  static debug = require('./debug')('@lando/core:config');

  static keys(data, {prefix = '', expandArrays = true} = {}) {
    return require('../utils/get-object-keys')(data, {prefix, expandArrays});
  }

  // @TODO: error handling
  static merge(object, sources, ams = ['merge:id', 'replace']) {
    // if sources is not an array then make it so
    if (!Array.isArray) sources = [sources];

    // normalize ams into array
    ams = Array.isArray(ams) ? ams : [ams];
    // then break into the things we need
    const first = ams[0].split(':')[0];
    const by = ams[0].split(':')[1] || 'id';
    const fallback = ams[1] || 'replace';

    // then return the merge
    return merge(object, ...sources, (objValue, srcValue) => {
      // if not an arrayjust proceed normally
      if (!Array.isArray(objValue)) return undefined;
      // if first strategy is replace then also proceed normally
      if (first === 'replace') return undefined;
      // if first strategy is merge and some part of objvalue has an object then try to merge with by
      if (first === 'merge') {
        // if mergable object detected in array then proceed
        if (objValue.some(element => isObject(element))) return mergeArrays(objValue, srcValue, `merge:${by}`);
        // otherwise return the fallback
        return mergeArrays(objValue, srcValue, fallback);
      }
      // if we get here then just pass it through to mergeArrays
      return mergeArrays(objValue, srcValue, first);
    });
  }

  constructor({
    ams = 'auto',
    data = {},
    debug = Config.debug,
    decode = true,
    encode = true,
    id = Config.id || basename(process.argv[1]),
    managed = 'managed',
    stores = {},
    cached,
  } = {}) {
    // super right away with no options
    super();

    // get options settled
    this.ams = ams === 'auto' ? ['merge:id', 'replace'] : ams;
    this.cached = cached;
    this.debug = debug;
    this.decode = decode;
    this.encode = encode;
    this.id = id;
    this.managed = managed;

    // start with a memcache
    this.add('#mem', {type: 'memory', readOnly: false});
    // populated with data if applicable
    if (data && data !== null && typeof data === 'object') this.stores['#mem'].store = data;

    // mix in all passed in stores except #mem which is a special thing
    for (const [name, store] of Object.entries(stores)) {
      if (name !== '#mem') this.stores[name] = store;
    }

    // log
    this.debug('initialized config %o with options %o', this.id, {cached, decode, encode, managed});
  }

  add(name, options) {
    // log
    const dopts = {encode: get(options, 'encode', this.encode), source: options.file};
    this.debug('adding %o store %o to %o config %o', options.type, name, this.id, dopts);
    // kick upstream
    super.add(name, {logicalSeparator: '.', parseValues: true, ...options});

    // encode the new store if applicable
    if (get(options, 'encode', this.encode) && get(this, `stores.${name}.store`)) {
      this.stores[name].store = encodeKeys(this.stores[name].store);
    }

    // ensure store as at least an empty object
    if (this.stores[name].store === null || this.stores[name].store === undefined) this.stores[name].store = {};

    return this;
  }

  defaults(name, data, options) {
    return this.add(name, {...options, type: 'literal', store: data});
  }

  dump() {
    fs.mkdirSync(dirname(this.cached), {recursive: true});
    write(this.cached, this);
    this.debug('dumped compiled and cached config file to %o', this.cached);
  }

  env(name = this.id) {
    const separator = '_';
    const rootKey = `${name.toUpperCase()}${separator}`;
    return this.add(name, {
      logicalSeparator: '.',
      lowerCase: true,
      parseValues: true,
      transform: obj => {
        if (obj.key.startsWith(rootKey.toLowerCase())) {
          obj.key = obj.key.replace(rootKey.toLowerCase(), '');
          obj.key = obj.key.replace(new RegExp(`${separator}${separator}`, 'g'), '-');
          obj.key = obj.key.replace(new RegExp(separator, 'g'), '.');
          return obj;
        }
      },
      type: 'env',
      separator,
    });
  }

  file(name, options) {
    // if options is a string and path that exists then reset it as file
    if (typeof options === 'string' && fs.existsSync(options)) options = {file: options};

    // try to get the format
    // @TODO: throw error if format is undefined?
    const extension = extname(options.file).substring(1);
    const format = nconf.formats[extension];

    // if a js file then we can only load as a literal,
    // this is a special case because nconf.formatters really doesnt work for js file
    // @NOTE: this can also load JS functions and it injects THIS into them
    // @NOTE: we also do this instead of a formatter because that would require use of eval
    if (extension === 'js') {
      const store = (typeof read(options.file) === 'function') ? read(options.file)(this) : read(options.file);
      return this.add(name, {...options, type: 'literal', store});
    }

    // otherwise just pass through
    return this.add(name, {...options, format, type: 'file'});
  }

  // replace nconf get wrapper with this one
  // @TODO: options: arraystrat?
  // @NOTE: we override super.get because it doesnt handle nilly-nully stores well and it doesnt merge deeply
  get(path, options, data, store) {
    // if we are targetting a specific store then just do that
    if (path && typeof path === 'string' && path.split(':').length >= 2) {
      const parts = path.split(':');
      store = parts.shift();
      path = parts.join('.');
      data = this.stores[store].store;

    // otherwise get the merged data, this is where the magix happens
    } else {
      data = Config.merge(
        {},
        Object.keys(this.stores).reverse().map(store => this.stores[store].store),
        get(options, 'ams', this.ams),
      );
    }

    // if we are encoded then make sure the path is encoded
    if (get(options, 'encode', this.encode)) path = encode(path);

    // if we have a path then select from data
    if (path) data = get(data, path);

    // return decoded or not
    this.debug('getting %o from %o config', path || 'everything', store ? `${this.id}:${store}` : this.id);
    return get(options, 'decode', this.decode) ? decodeKeys(data) : data;
  }

  // like get but with no decoding/encoding
  getRaw(path, options) {
    return this.get(path, {...options, encode: false, decode: false});
  }

  // return uncoded
  getUncoded(path, options) {
    return this.get(path, {...options, encode: true, decode: false});
  }

  overrides(name, data, options) {
    return this.add(name, {...options, type: 'literal', store: data});
  }

  // removes a property and saves the store if applicable
  remove(path, store = this.managed) {
    // if this is not a file store then just unset and move on
    if (!has(this.stores, `${store}.file`)) {
      unset(this.stores[store].store, path);

    // otherwise we are talking about files
    } else {
      // get the store destination
      const dest = get(this.stores, `${store}.file`);

      // if this is a yaml file then lets try to reconcile comments and data
      if (['.yaml', '.yml'].includes(extname(dest))) {
        // load the yaml doc
        const yamlDoc = yaml.parseDocument(fs.readFileSync(dest, 'utf8'));
        // remove the prop
        yamlDoc.deleteIn(path.split('.'));

        // write the result
        fs.writeFileSync(dest, yamlDoc.toString());

      // otherwise to the usual removal
      } else {
        unset(this.stores[store].store, path);
        write(dest, (this.stores[store].store));
      }
    }

    // finally debug and reset
    this.debug('removed %o from %o', path, `${this.id}:${store}`);
    this.reset();

    // dump cache if that makes sense
    if (this.cached) this.dump();
  }

  // overriden save method
  save(data, store = this.managed, options) {
    // purposefully try to type parse things
    // NOTE: is this a good idea?
    for (const key of Config.keys(data)) {
      if (get(data, key)) {
        // booleans
        if (get(data, key) === 'true' || get(data, key) === '1') set(data, key, true);
        if (get(data, key) === 'false' || get(data, key) === '0') set(data, key, false);
        // arrays of strings
        if (Array.isArray(this.get(key)) && typeof get(data, key) === 'string') {
          set(data, key, get(data, key).split(/, |[ ,|]/));
        }
      }
    }

    // get the store destination
    const dest = get(this.stores, `${store}.file`);
    // throw error if no destination
    if (!dest) throw new Error('something');

    // figure out the encoding
    if (get(options, 'encode', this.encode)) data = encodeKeys(data);

    // if this is a yaml file then lets try to reconcile comments and data
    if (['.yaml', '.yml'].includes(extname(dest))) {
      // load the yaml doc
      const yamlDoc = yaml.parseDocument(fs.readFileSync(dest, 'utf8'));
      // go through the data and set it into the doc
      for (const path of Config.keys(data)) {
        yamlDoc.setIn(path.split('.'), get(data, path));
      }

      // write the result
      fs.writeFileSync(dest, yamlDoc.toString());

    // otherwise to the usual saving
    } else {
      this.stores[store].store = Config.merge({}, [this.stores[store].store, data], get(options, 'ams', this.ams));
      write(dest, this.stores[store].store);
    }

    // finally debug and reset
    this.debug('saved %o to %o', data, dest);
    this.reset();

    // dump cache if that makes sense
    if (this.cached) this.dump();
  }

  set(path, data, options) {
    // encode the path if needed
    if (get(options, 'encode', this.encode)) path = encode(path);
    // then just bounce upstream
    super.set(path, data);
  }

  // this reverses the above
  unset(path) {
    this.remove(path, '#mem');
  }
}

module.exports = Config;
