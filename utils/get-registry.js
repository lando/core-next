const debug = require('debug')('@lando/core:utils:get-registry');
const normalizeRegistryPaths = require('./normalize-registry-paths');
const path = require('path');

const Config = require('../core/config');

/*
 * TBD
 */
module.exports = (config = {}, plugins = {}) => {
  // spin up a config instance to help us merge it all together
  const registry = new Config({env: false, id: 'registry'});

  // go through stores
  for (const [name, store] of Object.entries(config.stores)) {
    // if a file store then we need to normalize the registry
    if (store.type === 'file') {
      registry.add(name, {
        type: 'literal',
        store: normalizeRegistryPaths(store.get('registry'), path.dirname(store.file)),
      });
    // otherwise just add it as is
    } else if (store.type !== 'env') {
      registry.add(name, {type: 'literal', store: store.get('registry')});
    }
  }

  // then go through all the plugins and do the same, the order here is not important
  for (const [name, plugin] of Object.entries(plugins)) {
    registry.add(name, {
      type: 'literal',
      store: normalizeRegistryPaths(plugin.manifest.registry, plugin.location),
    });
  }

  // return
  debug('added %o component(s) to the %o registry', Config.keys(registry.get()).length, config.get('system.id'));
  return registry.getUncoded();
};
