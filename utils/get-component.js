'use strict';

const fs = require('fs');
const has = require('lodash/has');
const isObject = require('lodash/isPlainObject');

const Config = require('../lib/config');

/*
 * TBD
 */
module.exports = (
  component,
  registry = new Config({id: 'component-registry'}),
  {
    aliases = {},
    config = {},
    cache = undefined,
    debug = require('../lib/debug')('@lando/core:get-component'),
  } = {},
  ) => {
  // determine whether we should cache or not
  const shouldCache = isObject(cache);

  // throw error if config is not a Config class
  if (!registry.constructor || registry.constructor.name !== 'Config') {
    throw new Error('get-component requires registry be a Config class');
  }

  // our intentions
  debug('looking for %o in %o', component, registry.id);

  // if an alias then rerun
  if (has(aliases, component)) return module.exports(aliases[component], registry, {aliases, config, cache, debug});

  // if class is already loaded in registry and cache is true then just return the class
  if (shouldCache && cache[component]) {
    debug('retrieved %o from component cache', component);
    return cache[component];
  }

  // try to get the path to the component
  const componentPath = registry.get(component);
  // if there is no component or it does not exist then throw an error
  if (!componentPath || (!fs.existsSync(componentPath) && !fs.existsSync(`${componentPath}.js`))) {
    throw new Error(`could not find component ${component}`);
  }

  // otherwise try to load the component from the config
  const loader = require(componentPath);
  const isDynamic = loader.extends && typeof loader.getComponent === 'function';

  // if component is "dynamically extended" then get its parent and run its getComponent function
  //
  // we use this instead of the usual class extension when the components parent is not static and is not known until
  // the configuration has been compiled. an example would be the docker-npm plugin-installer component which extends
  // whatever core.engine is
  //
  // otherwise assume the loader is the class itself
  const Component = isDynamic ? loader.getComponent(module.exports(loader.extends, registry, {alises, cache, config, debug})) : loader;

  // if Component is not a class then error
  if (!require('is-class')(Component)) throw new Error(`component ${component} needs to be a class`);

  // mix in some config
  Config.merge(Component.config, [config]);

  // reset the default debug namespace
  Component.debug = debug.contract(-1).extend(Component.name);

  // and set in cache if applicable
  if (shouldCache) cache[component] = Component;

  // and return
  debug('retrieved component %o from %o', component, registry.id);
  return Component;
};
