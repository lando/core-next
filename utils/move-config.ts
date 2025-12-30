'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const remove = require('./remove');

module.exports = (src: string, dest: string = os.tmpdir()) => {
  fs.mkdirSync(dest, {recursive: true});

  try {
    // Filter out .js files to avoid giving the false impression they can be edited
    fs.copySync(src, dest, {
      filter: (filepath: string) => path.extname(filepath) !== '.js',
    });
    require('./make-executable')(_(fs.readdirSync(dest))
      .filter((file: string) => path.extname(file) === '.sh')
      .value()
    , dest);
  } catch (error: any) {
    const code = _.get(error, 'code');
    const syscall = _.get(error, 'syscall');
    const f = _.get(error, 'path');

    if (code !== 'EISDIR' || syscall !== 'open' || !!fs.mkdirSync(f, {recursive: true})) {
      remove(f);
      throw new Error(error);
    }

    remove(f);
    fs.copySync(src, dest, {
      filter: (filepath: string) => path.extname(filepath) !== '.js',
    });
    require('./make-executable')(_(fs.readdirSync(dest))
      .filter((file: string) => path.extname(file) === '.sh')
      .value()
    , dest);
  }

  return dest;
};
