'use strict';

const fs = require('fs');
const path = require('path');

module.exports = (file, extension) => {
  // @TODO: file does nto exist?
  // set extension if not set
  if (!extension) extension = path.extname(file);

  // @TODO: better try/catches here?
  // @TODO: throw error for default?
  switch (extension) {
    case '.yaml':
    case '.yml':
    case 'yaml':
    case 'yml':
      return require('yaml').parse(fs.readFileSync(file, 'utf8'));
    case '.js':
    case 'js':
      return require(file);
    case '.json':
    case 'json':
      return require('jsonfile').readFileSync(file);
    default:
      // throw error
  }
};
