import path from 'node:path';

import get from 'lodash-es/get.js';
import set from 'lodash-es/set.js';

import getKeys from './get-object-keys.js';

const defaultPathyKeys = ['hooks', 'registry', 'tasks'];

/**
 * Resolve relative paths within a manifest to absolute paths.
 *
 * @param {object} [data={}] - Manifest object.
 * @param {string} base - Base directory to resolve from.
 * @param {string[]} [pathyKeys=defaultPathyKeys] - Keys that contain paths.
 * @returns {object} The mutated manifest.
 */
export default function normalizeManifestPaths(data = {}, base, pathyKeys = defaultPathyKeys) {
  // @TODO: error handling?

  for (const key of getKeys(data)) {
    // skip if not a pathy key
    if (!pathyKeys.includes(key.split('.')[0])) continue;
    // reset data to be an absolute path
    // @TODO: should we test if abolute path exists?
    if (key && typeof get(data, key) === 'string' && !path.isAbsolute(get(data, key))) {
      set(data, key, path.resolve(base, get(data, key)));
    }
  }

  // then return
  return data;
}
