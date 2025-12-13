import createDebug from '../lib/debug.js';
import getComponent from './get-component.js';

import Config from '../lib/config.js';

/**
 * Instantiate a component class and optionally run its `init` method.
 *
 * @param {string} component - Component id or path.
 * @param {*} constructor - Argument(s) passed to the component constructor.
 * @param {object} [options]
 * @param {object} [options.aliases] - Component alias map.
 * @param {boolean} [options.cache=true] - Whether to cache loaded classes.
 * @param {Function} [options.debug] - Debug logger factory.
 * @param {object} [options.config] - Configuration passed to the component.
 * @param {object} [options.defaults] - Default options passed to init.
 * @param {boolean} [options.init=true] - Call the component `init` method.
 * @param {Config} [options.registry] - Component registry.
 * @returns {Promise<*>} An initialized component instance.
 */
export default async function getComponentInstance(
  component,
  constructor,
  {
    aliases = {},
    cache = true,
    debug = createDebug('@lando/core:get-component-instance'),
    config = {},
    defaults = {},
    init = true,
    registry = new Config({ id: 'component-registry' }), // eslint-disable-line new-cap
  } = {},
) {
  // get class component and instantiate
  const Component = getComponent(component, registry, { aliases, cache, config, debug });

  // get an instance
  const instance = Array.isArray(constructor) ? new Component(...constructor) : new Component(constructor);

  // and run its init func if applicable
  if (instance.init && typeof instance.init === 'function' && init) {
    await instance.init(constructor, { config, registry, cache, defaults, init });
  }

  // debug
  debug('instantiated %o with init %o', component, init);
  // and return
  return instance;
}
