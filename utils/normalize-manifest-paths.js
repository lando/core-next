const get = require('lodash/get');
const path = require('path');
const set = require('lodash/set');

const Config = require('../core/config');

module.exports = (data = {}, base) => {
  // @TODO: allow this to handle objects and arrays
  // go through the keys and try to normalize on base
  for (const component of Config.keys(data)) {
    if (component && typeof get(data, component) === 'string' && !path.isAbsolute(get(data, component))) {
      set(data, component, path.resolve(base, get(data, component)));
    }
  }

  // then return
  return data;
};
