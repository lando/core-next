import fs from 'node:fs';
import isClass from 'is-class';

import has from 'lodash-es/has.js';
import isObject from 'lodash-es/isPlainObject.js';
import merge from './merge.js';

import createDebug from '../lib/debug.js';
import Config from '../lib/config.js';

/**
 * Resolve and load a component class from a registry.
 *
 * @param {string} component - Component id to load.
 * @param {Config} [registry] - Component registry.
 * @param {object} [options]
 * @param {object} [options.aliases] - Mapping of aliases to component ids.
 * @param {object} [options.config] - Configuration to merge into the class.
 * @param {object} [options.cache] - Object used to cache loaded classes.
 * @param {Function} [options.debug] - Debug logger factory.
 * @returns {Function} Loaded component class.
 */
export default function getComponent(
  component,
  registry = (registry = new Config({ id: 'component-registry' })), // eslint-disable-line new-cap
  { aliases = {}, config = {}, cache = undefined, debug = createDebug('@lando/core:get-component') } = {},
) {
  // determine whether we should cache or not
  const shouldCache = isObject(cache);

  // throw error if config is not a Config class
  if (!registry.constructor || registry.constructor.name !== 'Config') {
    throw new Error('get-component requires registry be a Config class');
  }

  // our intentions
  debug('looking for %o in %o', component, registry.id);

  // if an alias then rerun
  if (has(aliases, component)) return getComponent(aliases[component], registry, { aliases, config, cache, debug });

  // if class is already loaded in registry and cache is true then just return the class
  if (shouldCache && cache[component]) {
    debug('retrieved %o from component cache', component);
    return cache[component];
  }

  // try to get the path to the component
  // @TODO: this should be a loader?
  // if function then async?
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
  const Component = isDynamic
    ? loader.getComponent(getComponent(loader.extends, registry, { aliases, cache, config, debug }))
    : (loader.default ?? loader);

  // if Component is not a class then error
  if (!isClass(Component)) throw new Error(`component ${component} needs to be a class`);

  // mix in some config
  Component.config = merge({}, [Component.config, config]);

  // reset the default debug namespace
  Component.debug = debug.contract(-1).extend(Component.name);

  // and set in cache if applicable
  if (shouldCache) cache[component] = Component;

  // and return
  debug('retrieved component %o from %o', component, registry.id);

  return Component;
}
