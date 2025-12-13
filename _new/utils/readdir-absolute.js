import fs from 'node:fs';
import path from 'node:path';

/**
 * Read a directory and return absolute paths to sub-directories only.
 *
 * NOTE: This avoids external dependencies for bootstrapping.
 *
 * @param {string} dir - Directory to read.
 * @returns {string[]} Array of absolute directory paths.
 */
export default function readDirAbsolute(dir) {
  return fs
    .readdirSync(dir)
    .map((file) => path.join(dir, file))
    .filter((file) => fs.statSync(file).isDirectory());
}
