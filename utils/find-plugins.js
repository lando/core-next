'use strict';

const fs = require('fs');
const path = require('path');
const readdirSyncAbsDir = require('./readdir-absolute');

/*
 * Recurses through directories to given depth looking for plugins
 *
 * NOTE: we are using something like this mostly just for bootstrapping eg
 * we want it to have minimal deps eg no LODASH or GLOB
 */
// @TODO: make pConfigFiles configurable?
module.exports = (dir, depth = 1) => {
  // if dir doesnt exist then return []
  if (!fs.existsSync(dir)) return [];

  // if depth 0 then only look in teh dir passed in
  const dirs = depth === 0 ? [dir] : readdirSyncAbsDir(dir);
  // list of files that indicate we have a plugin
  const pConfigFiles = ['plugin.js', 'plugin.yaml', 'plugin.yml', 'package.json'];
  // rescurse through dirs until we are good
  return dirs.map(dir => {
    // return if path contains a plugin
    if (pConfigFiles.some(file => fs.existsSync(path.join(dir, file)))) return dir;
    // otherwise recurse if depth allows
    if (depth > 1) return module.exports(dir, depth - 1);
    // otherwise null
    return null;
  })
  // flatten
  .flat(Number.POSITIVE_INFINITY)
  // remove nully
  .filter(dir => dir);
};
