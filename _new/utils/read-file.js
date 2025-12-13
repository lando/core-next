import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

import jsonfile from 'jsonfile';

import { parse as readYAML, parseDocument as readYAMLDoc } from 'yaml';
const readCJS = createRequire(import.meta.url);
const { readFileSync: readJSON } = jsonfile;

const _read = (file) => fs.readFileSync(file, { encoding: 'utf8' });

/**
 * Read a file and automatically parse based on extension.
 *
 * @param {string} file - File path to read.
 * @param {object} [options]
 * @param {string} [options.extension] - File extension override.
 * @param {boolean} [options.fullYamlDoc=false] - Return full YAML document.
 * @returns {*} Parsed file contents.
 */
export default function read(file, options = {}) {
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
      return fullYamlDoc ? readYAMLDoc(_read(file), options) : readYAML(_read(file), options);
    }

    default:
      return _read(file);
  }
}
