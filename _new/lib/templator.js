import fs from 'node:fs';
import path from 'node:path';

import createDebug from '../lib/debug.js';
import encodeKeys from '../utils/encode-keys.js';
import read from '../utils/read-file.js';
import write from '../utils/write-file.js';

/*
 * @TODO
 */
class Templator {
  static id = 'templator';
  static debug = createDebug('lando:templator');

  static getType(source) {
    // is a file
    if (typeof source === 'string' && fs.existsSync(source)) return 'file';
    // is a function or object
    if (typeof source === 'function' || typeof source === 'object') return typeof source;

    return undefined;
  }

  /*
   * source can be path or object?
   */
  constructor(source, dest, { debug = Templator.debug, encode = true, overwrite = false } = {}) {
    // @TODO: error handling eg no source/dest?

    // required props
    this.source = source;
    this.dest = dest;
    this.name = this.source?.name ?? this.source;

    // handle objects with bad names
    if (typeof this.name === 'object') this.name = 'object';

    // options
    this.debug = debug;
    this.encode = encode;
    this.overwrite = overwrite;

    // ensure dest dir exists
    if (dest && !fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      this.debug('ensured %o directory %o exists', source, path.dirname(dest));
    }
  }

  // @TODO: include data here at some point?
  // @TODO: readargs/writeargs?
  // @TODO: how best to split options up?
  // @TODO: actually handle template vars here at some point?
  generate({ readOpts = {}, funcOpts = {} } = {}) {
    // if destination already exists and we arent replacing then bail
    if (fs.existsSync(this.dest) && !this.overwrite) {
      this.debug('%o already exists and overwrite %o so not generating', this.dest, this.overwrite);
      return;
    }

    // get original type
    const type = Templator.getType(this.source);

    // if source is a file then lets read it in
    if (Templator.getType(this.source) === 'file') this.source = read(this.source, { extension: undefined, ...readOpts });

    // if source is a function then lets invoke it
    if (Templator.getType(this.source) === 'function') this.source = this.source(funcOpts);

    // if source is an objec then we are done?
    if (Templator.getType(this.source) === 'object') {
      this.encode ? write(this.dest, encodeKeys(this.source)) : write(this.dest, this.source);
      this.debug('generated %o file %o from %o template %o', this.encode ? 'encoded' : 'as is', this.dest, type, this.name);
    }
  }
}

export default Templator;
