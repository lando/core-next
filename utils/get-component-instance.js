'use strict';

const Config = require('../lib/config');

/*
 * TBD
 */
module.exports = async (component, constructor, {
  aliases = {},
  cache = true,
  debug = require('../lib/debug')('@lando/core:get-component-instance'),
  config = {},
  init = true,
  registry = new Config({id: 'component-registry'}),
} = {}) => {
  // get class component and instantiate
  const Component = require('./get-component')(
    component,
    registry,
    {aliases, cache, config, debug},
  );

  // get an instance
  const instance = Array.isArray(constructor) ? new Component(...constructor) : new Component(constructor);

  // and run its init func if applicable
  if (instance.init && typeof instance.init === 'function' && init) {
    await instance.init(constructor, {config, registry, cache, defaults, init});
  }

  // debug
  debug('instantiated %o with init %o', component, init);
  // and return
  return instance;
};
