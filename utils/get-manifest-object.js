const debug = require('debug')('@lando/core:utils:get-manifest-object');
const nmp = require('./normalize-manifest-paths');
const path = require('path');

const Config = require('../core/config');

/*
 * TBD
 */
module.exports = (key, config = {}, plugins = {}) => {
  // spin up a config instance to help us merge it all together
  const data = new Config({env: false, id: key});

  // go through stores
  for (const [name, store] of Object.entries(config.stores)) {
    // if a file store then we need to normalize the registry
    if (store.type === 'file') {
      data.add(name, {
        type: 'literal',
        store: nmp(store.get(key), path.dirname(store.file)),
      });
    // otherwise just add it as is
    } else if (store.type !== 'env') {
      data.add(name, {type: 'literal', store: store.get(key)});
    }
  }

  // then go through all the plugins and do the same, the order here is not important
  for (const [name, plugin] of Object.entries(plugins)) {
    data.add(name, {
      type: 'literal',
      store: nmp(plugin.manifest[key], plugin.location),
    });
  }

  // return
  debug('found %o things(s) in %o for %o', Config.keys(data.get()).length, `manifest.${key}`, config.get('system.id'));
  return data.getUncoded();
};
