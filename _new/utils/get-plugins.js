import createDebug from '../lib/debug.js';
import findPlugins from './find-plugins.js';
import getSize from './get-size.js';
import normalizePlugins from './normalize-plugins.js';

import DConfig from '../lib/config.js';
import DPlugin from '../lib/plugin.js';

/**
 * Discover and load plugins from various directories.
 *
 * @param {Array} [sources=[]] - Source directories or objects.
 * @param {object} [options] - Options forwarded to Plugin constructors.
 * @param {object} [deps] - Dependency injection overrides.
 * @param {Function} [deps.debug] - Debug creator.
 * @param {typeof DConfig} [deps.Config] - Config class.
 * @param {typeof DPlugin} [deps.Plugin] - Plugin class.
 * @returns {object} Categorized plugins {enabled, disabled, invalids}.
 */
export default function getPlugins(
  sources = [],
  options = {},
  { debug = createDebug('@lando/core:get-plugins'), Config = DConfig, Plugin = DPlugin } = {},
) {
  // @TODO: error handling?
  // normalize plugins and sort by weight if applicable?
  sources = sources
    // if the source is a string then map into array
    .map((source) => (typeof source === 'string' ? { dir: source } : source))
    // rebase on some defaults
    .map((source) => ({ id: source.dir, weight: 0, depth: 2, ...source }))
    // sort by weight
    .sort((a, b) => {
      if (a.weight < b.weight) return -1;
      if (a.weight > b.weight) return 1;
      return 0;
    });

  // kick off message
  debug(
    'looking for plugins in %o',
    sources.flatMap((source) => source.dir),
  );

  // start by looping through sources and separating all the things
  for (const source of sources) {
    // make sure plugins is at least an empty array
    if (!source.plugins || !Array.isArray(source.plugins)) source.plugins = [];

    // if we have a directory
    if (source.dir) {
      source.plugins = [
        ...source.plugins,
        ...findPlugins(source.dir, source.depth)
          .flat(Number.POSITIVE_INFINITY)
          .map((dir) => new Plugin(dir, options)),
      ];
    }

    // then separate out valid and invalid plugins
    if (source.plugins && Array.isArray(source.plugins)) {
      source.disabled = source.plugins.filter((plugin) => plugin.isValid && !plugin.enabled);
      source.enabled = source.plugins.filter((plugin) => plugin.isValid && plugin.enabled);
      source.invalids = source.plugins.filter((plugin) => !plugin.isValid);
    }
  }

  // stuff
  const disabled = new Config({ id: 'plugins.disabled', decode: false, encode: false });
  const enabled = new Config({ id: 'plugins.enabled', decode: false, encode: false });
  const invalids = new Config({ id: 'plugins.invalid', decode: false, encode: false });

  // do the priority resolution
  for (const source of sources.reverse()) {
    // disabled
    if (source.disabled && source.disabled.length > 0) {
      disabled.add(source.id, { type: 'literal', store: normalizePlugins(source.disabled) });
    }
    // enabled
    if (source.enabled && source.enabled.length > 0) {
      enabled.add(source.id, { type: 'literal', store: normalizePlugins(source.enabled) });
    }
    // invalid
    if (source.invalids && source.invalids.length > 0) {
      invalids.add(source.id, { type: 'literal', store: normalizePlugins(source.invalids) });
    }
  }

  // assemble
  const plugins = { disabled: disabled.get(), enabled: enabled.get(), invalids: invalids.get() };
  // summarize discovery
  const summary = { disabled: getSize(plugins.disabled), enabled: getSize(plugins.enabled), invalids: getSize(plugins.invalids) };
  debug('found %o plugins with breakdown %o', summary.disabled + summary.enabled + summary.invalids, summary);

  // return
  return plugins;
}
