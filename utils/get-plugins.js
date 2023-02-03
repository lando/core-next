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
      source.invalids = source.plugins.filter(plugin => !plugin.isValid);
      source.plugins = source.plugins.filter(plugin => plugin.isValid && plugin.enabled);
    }
  }

  // stuff
  const disabled = new Config({env: false, id: 'disabled-plugins'});
  const invalids = new Config({env: false, id: 'invalid-plugins'});
  const plugins = new Config({env: false, id: 'valid-plugins'});

  // do the priority resolution
  for (const source of sources) {
    // valid and disabled
    if (source.disabled && source.disabled.length > 0) {
      debug('added %o plugin(s) to the %o store', source.disabled.length, `${source.store}-disabled`);
      disabled.add(source.store, {type: 'literal', store: normalizePlugins(source.disabled)});
    }
    // invalid
    if (source.invalids && source.invalids.length > 0) {
      debug('plugin(s) %o do not appear to be valid plugins, skipping', source.invalids.map(plugin => plugin.name));
      invalids.add(source.store, {type: 'literal', store: normalizePlugins(source.invalids)});
    }
    // valid and enabled
    if (source.plugins && source.plugins.length > 0) {
      debug('added %o plugin(s) to the %o store', source.plugins.length, `${source.store}-enabled`);
      plugins.add(source.store, {type: 'literal', store: normalizePlugins(source.plugins)});
    }
  }

  // and return
  return {disabled: disabled.getUncoded(), invalids: invalids.getUncoded(), plugins: plugins.getUncoded()};
};
