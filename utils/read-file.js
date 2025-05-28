import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import jsonfile from 'jsonfile';

import { parse as readYAML, parseDocument as readYAMLDoc } from 'yaml';
const readCJS = createRequire(import.meta.url);
const { readFileSync: readJSON } = jsonfile;

const read = (file) => fs.readFileSync(file, { encoding: 'utf8' });

export default (file, options = {}) => {
  // @TODO: file does nto exist?

  // set extension if not set
  const extension = options.extension ?? path.extname(file);
  // yaml expansion
  const fullYamlDoc = options.fullYamlDoc ?? false;

  // @TODO: better try/catches here?
  // @TODO: throw error for default?
  switch (extension) {
    case '.cjs':
    case 'cjs':
    case '.js':
    case 'js': {
      return readCJS(file);
    }

    case '.json':
    case 'json': {
      return readJSON(file, options);
    }

    case '.yaml':
    case '.yml':
    case 'yaml':
    case 'yml': {
      return fullYamlDoc ? readYAMLDoc(read(file), options) : readYAML(read(file), options);
    }

    default:
      return read(file);
  }
};
