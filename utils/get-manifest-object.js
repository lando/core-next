'use strict';

const nmp = require('./normalize-manifest-paths');
const path = require('path');

const Config = require('../lib/config');

/*
 * TBD
 */
module.exports = (key, {plugins = {}, config, debug = require('../lib/debug')('@lando/core')} = {}) => {
  // spin up a config instance to help us merge it all together
  const data = new Config({env: false, debug, id: key});

  // go through config stores if we can
  if (Object.keys(config).length > 0) {
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
  }

  // then go through all the plugins and do the same, the order here is not important
  if (Object.keys(plugins).length > 0) {
    for (const [name, plugin] of Object.entries(plugins)) {
      data.add(name, {
        type: 'literal',
        store: nmp(plugin.manifest[key], plugin.location),
      });
    }
  }

  // return
  debug.extend('get-manifest-object')('found %o things(s) in %o', Config.keys(data.get()).length, `manifest.${key}`);
  return data.getUncoded();
};
