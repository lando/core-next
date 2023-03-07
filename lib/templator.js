'use strict';

const fs = require('fs');
const path = require('path');
const read = require('../utils/read-file');
const write = require('../utils/write-file');

/*
 * @TODO
 */
class Templator {
  static id = 'templator';
  static debug = require('./debug')('@lando/core:templator');

  /*
   * source can be path or object?
   */
  constructor(source, dest, {
    debug = Templator.debug,
    encode = true,
    overwrite = false,
  } = {}) {
    // @TODO: error handling eg no source/dest?
    // @TODO: debugger?

    // required props
    this.source = source;
    this.dest = dest;
    // options
    this.debug = debug;
    this.encode = encode;
    this.overwrite = overwrite;

    // ensure dest dir exists
    if (dest && !fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), {recursive: true});
      this.debug('ensured %o directory %o exists', source, path.dirname(dest));
    }
  }

  // @TODO: include data here at some point?
  // @TODO: readargs/writeargs?
  // @TODO: how best to split options up?
  // @TODO: actually handle template vars here at some point?
  generate(options) {
    // if destination already exists and we arent replacing then bail
    if (fs.existsSync(this.dest) && !this.overwrite) {
      this.debug('%o already exists and overwrite %o so not generating', this.dest, this.overwrite);
      return;
    };

    // read in source
    const data = (typeof read(this.source) === 'function') ? read(this.source)(options) : read(this.source);
    // write out data as appropriate
    this.encode ? write(this.dest, require('../utils/encode')(data)) : write(this.dest, data);
    this.debug('generated %o file %o from template %o', this.encode ? 'encoded' : 'as is', this.dest, this.source);
  }
}

module.exports = Templator;
