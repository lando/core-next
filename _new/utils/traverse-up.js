import path from 'node:path';

import dropRight from 'lodash-es/dropRight.js';
import range from 'lodash-es/range.js';

/**
 * Generate upward file paths from a starting directory.
 *
 * @param {string[]} files - File names to append at each level.
 * @param {string} startsFrom - Initial directory path.
 * @returns {string[]} Array of candidate file paths.
 */
export default function traverseUp(files, startsFrom) {
  return range(startsFrom.split(path.sep).length)
    .map((end) => dropRight(startsFrom.split(path.sep), end).join(path.sep))
    .map((dir) => files.map((file) => path.join(dir, path.basename(file))))
    .flat(Number.POSITIVE_INFINITY);
}
