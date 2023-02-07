'use strict';

const findPlugins = require('./find-plugins');
const normalizePlugins = require('./normalize-plugins');

const Config = require('../lib/config');
const DefaultPlugin = require('../lib/plugin');

/*
 * TBD
 */
module.exports = (
  sources = [],
  options = {},
  {Plugin = DefaultPlugin, debug = require('../lib/debug')('@lando/core:get-plugins')} = {},
  ) => {
  // kick off message
  debug('looking for plugins in %o', sources.flatMap(source => source.dirs).filter(Boolean).map(dir => dir.dir));

  // start by looping through sources and separating all the things
  for (const source of sources) {
    // make sure plugins is at least an empty array
    if (!source.plugins || !Array.isArray(source.plugins)) source.plugins = [];

    // if we have directories to scan then scan them
    if (source.dirs && Array.isArray(source.dirs)) {
      source.plugins = [
        ...source.plugins,
        ...source.dirs
          .map(dir => findPlugins(dir.dir, dir.depth))
          .flat(Number.POSITIVE_INFINITY)
          .map(dir => new Plugin(dir, {type: source.store, ...options})),
        ];
    }

    // then separate out valid and invalid plugins
    if (source.plugins && Array.isArray(source.plugins)) {
      source.disabled = source.plugins.filter(plugin => plugin.isValid && !plugin.enabled);
      source.enabled = source.plugins.filter(plugin => plugin.isValid && plugin.enabled);
      source.invalids = source.plugins.filter(plugin => !plugin.isValid);
    }
  }

  // stuff
  const disabled = new Config({env: false, id: 'plugins.disabled'});
  const enabled = new Config({env: false, id: 'plugins.enabled'});
  const invalids = new Config({env: false, id: 'plugins.invalid'});

  // do the priority resolution
  for (const source of sources) {
    // disabled
    if (source.disabled && source.disabled.length > 0) {
      disabled.add(source.store, {type: 'literal', store: normalizePlugins(source.disabled)});
    }
    // enabled
    if (source.enabled && source.enabled.length > 0) {
      enabled.add(source.store, {type: 'literal', store: normalizePlugins(source.enabled)});
    }
    // invalid
    if (source.invalids && source.invalids.length > 0) {
      invalids.add(source.store, {type: 'literal', store: normalizePlugins(source.invalids)});
    }
  }

  // assemble
  const plugins = {disabled: disabled.getUncoded(), enabled: enabled.getUncoded(), invalids: invalids.getUncoded()};
  // summarize

  // return
  return plugins;
};
