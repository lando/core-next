'use strict';

const fs = require('fs');
const path = require('path');

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
        return fs.writeFileSync(file, require('yaml').stringify(data));
      } catch (error) {
        throw new Error(error);
      }
    case '.json':
    case 'json':
      require('jsonfile').writeFileSync(file, data);
    default:
  }
};
