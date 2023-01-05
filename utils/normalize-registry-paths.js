const get = require('lodash/get');
const path = require('path');
const set = require('lodash/set');

const Config = require('../core/config');

module.exports = (registry = {}, base) => {
  // go through the keys and try to normalize on base
  for (const component of Config.keys(registry)) {
    if (component && typeof get(registry, component) === 'string' && !path.isAbsolute(get(registry, component))) {
      set(registry, component, path.resolve(base, get(registry, component)));
    }
  }

  // then return
  return registry;
};
