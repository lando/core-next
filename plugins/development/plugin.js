'use strict';

const path = require('path');

// @NOTE: context will be lando if global and a minapp if app
module.exports = context => {
  const plugin = {
    name: '@lando/development',
    registry: {legacy: {}},
  };

  // if devmode is on then add things to the registry for use
  if (context.config.get('core.development')) {
    // force core.caching to false
    // const cacheKey = 'core.caching';
    // context.config.set(cacheKey, false);
    // context.config.debug('%o plugin disables caching, %o set to %o', plugin.name, cacheKey, context.config.get(cacheKey));

    // load helper dev tasks
    plugin.registry.legacy.tasks = {
      'plugins': path.resolve(__dirname, 'tasks', 'plugins'),
      'registry': path.resolve(__dirname, 'tasks', 'registry'),
    };
  };

  // return plugin
  return plugin;
};
