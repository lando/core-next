import fs from 'node:fs';

import traverseUp from './traverse-up.js';

/**
 * Search upwards from a starting directory for the first existing file.
 *
 * @param {string[]} files - List of file names to look for.
 * @param {string} startFrom - Directory to begin searching in.
 * @returns {string|undefined} Path to the first file found or `undefined`.
 */
export default function findApp(files, startFrom) {
  return traverseUp(files, startFrom).find((file) => fs.existsSync(file));
}
