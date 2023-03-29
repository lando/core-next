'use strict';

const fs = require('fs');
const jsonfile = require('jsonfile');
const path = require('path');
const yaml = require('yaml');

module.exports = (file, data, extension) => {
  // @TODO: error handling, defaults etc?
  // create dir for file?

  // set extension if not set
  if (!extension) extension = path.extname(file);

  switch (extension) {
    case '.yaml':
    case '.yml':
    case 'yaml':
    case 'yml':
      try {
        return fs.writeFileSync(file, yaml.stringify(data));
      } catch (error) {
        throw new Error(error);
      }
    case '.json':
    case 'json':
      jsonfile.writeFileSync(file, data);
    default:
  }
};
