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
  static debug = createDebug('devtool:templator');

  /*
   * source can be path or object?
   */
  constructor(source, dest, { debug = Templator.debug, encode = true, overwrite = false } = {}) {
    // @TODO: error handling eg no source/dest?

    // required props
    this.source = source;
    this.dest = dest;
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

    // read in source
    const data = typeof read(this.source) === 'function' ? read(this.source)(funcOpts) : read(this.source, readOpts);

    // write out data as appropriate
    this.encode ? write(this.dest, encodeKeys(data)) : write(this.dest, data);
    this.debug('generated %o file %o from template %o', this.encode ? 'encoded' : 'as is', this.dest, this.source);
  }
}

export default Templator;
