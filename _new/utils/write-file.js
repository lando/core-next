import fs from 'node:fs';
import path from 'node:path';

import get from 'lodash-es/get.js';
import jsonfile from 'jsonfile';

import { stringify as stringifyYAML } from 'yaml';
const { writeFileSync: writeJSON } = jsonfile;

const _write = (file, data) => {
  if (!fs.existsSync(file)) fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data, { encoding: 'utf8' });
};

// @TODO: maybe extension should be in {options}?
// @TODO: error handling, defaults etc?
// @TODO: better data type handling
/**
 * Write data to a file with automatic serialization.
 *
 * @param {string} file - Destination file path.
 * @param {*} data - Data to write.
 * @param {object} [options]
 * @param {string} [options.extension] - Extension override.
 * @param {boolean} [options.forcePosixLineEndings=false] - Normalize line endings.
 */
export default function write(file, data, options = {}) {
  // set extension if not set
  const extension = options.extension ?? path.extname(file);
  // linux line endings
  const forcePosixLineEndings = options.forcePosixLineEndings ?? false;

  // special handling for ImportString
  // @TODO: we a better way to do this without a bunch of ImportString checking?
  if (typeof data !== 'string' && data?.constructor?.name === 'ImportString') data = data.toString();
  // data is a string and posixOnly then replace
  if (typeof data === 'string' && forcePosixLineEndings) data = data.replace(/\r\n/g, '\n');

  switch (extension) {
    case '.json':
    case 'json': {
      writeJSON(file, data, { spaces: 2, ...options });
      break;
    }

    case '.yaml':
    case '.yml':
    case 'yaml':
    case 'yml': {
      // if this is empty yaml then do nothing
      if (data === undefined || data === null) break;

      // otherwise special handling for a full yaml doc
      if (get(data, 'constructor.name') === 'Document') {
        // if this is empty then lets enforce nullStr to empty
        // this prevents an empty doc from outputting string "null"
        const nullStr = data.contents === null ? '' : 'null';

        _write(file, data.toString({ nullStr, ...options }));
        break;
      }

      // if this is a YAML DOC th en use yaml module
      _write(file, stringifyYAML(data, options));
      break;
    }

    default:
      _write(file, data);
  }
}
