import fs from 'node:fs';
import path from 'node:path';

import readdirSyncAbsDir from './readdir-absolute.js';

/**
 * Recursively search for plugin directories.
 *
 * NOTE: This is intentionally lightweight and avoids heavy dependencies.
 *
 * @param {string} dir - Directory to start searching in.
 * @param {number} [depth=1] - How deep to recurse into child directories.
 * @returns {string[]} Array of plugin directories found.
 */
// @TODO: make pConfigFiles configurable?
export default function findPlugins(dir, depth = 1) {
  // if dir doesnt exist then return []
  if (!fs.existsSync(dir)) return [];

  // if depth 0 then only look in teh dir passed in
  const dirs = depth === 0 ? [dir] : readdirSyncAbsDir(dir);
  // list of files that indicate we have a plugin
  const pConfigFiles = ['plugin.js', 'plugin.yaml', 'plugin.yml', 'package.json'];
  // rescurse through dirs until we are good
  return (
    dirs
      .map((dir) => {
        // return if path contains a plugin
        if (pConfigFiles.some((file) => fs.existsSync(path.join(dir, file)))) return dir;
        // otherwise recurse if depth allows
        if (depth > 1) return findPlugins(dir, depth - 1);
        // otherwise null
        return null;
      })
      // flatten
      .flat(Number.POSITIVE_INFINITY)
      // remove nully
      .filter((dir) => dir)
  );
}
