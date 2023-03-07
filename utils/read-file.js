'use strict';

const fs = require('fs');
const jsonfile = require('jsonfile');
const path = require('path');
const yaml = require('yaml');

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
      return yaml.parse(fs.readFileSync(file, 'utf8'));
    case '.js':
    case 'js':
      return require(file);

    case '.json':
    case 'json':
      return jsonfile.readFileSync(file);
    default:
      // throw error
  };
};
