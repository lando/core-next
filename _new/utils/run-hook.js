import fs from 'node:fs';

import createDebug from '../lib/debug.js';
import encode from './encode.js';
import load from './module-loader.js';

/**
 * Execute a named hook for a set of runners.
 *
 * @param {string} event - Hook name.
 * @param {object} data - Data passed to hook functions.
 * @param {object} [hooks] - Collection of hook arrays keyed by name.
 * @param {object} [context] - Context object passed as `this`.
 * @param {Function} [debug] - Debug logger.
 * @param {Function} [errorHandler] - Optional handler for the first failure.
 * @returns {Promise<{successes: Array, failures: Array}>} Hook results.
 */
export default async function runHook(event, data, hooks = [], context = {}, debug = createDebug('lando:run-hooks'), errorHandler) {
  // debugger
  debug = debug.extend(`hook:${event}`);
  // collect successes and failures
  const final = { successes: [], failures: [] };
  // just helpful message to indicate we have started a cli hook
  debug('start %o hook', event);
  // get targets
  const groups = hooks[event] ?? [];
  const targets = groups.map((group) => group.target ?? group);

  // generate promises from hooks
  const promises = targets.map(async (target) => {
    // 2. test from source
    // 3. test from compiled
    // 4. test error handler (allow quiet fail?)

    // if target is a string that exists then attempt to load it
    if (typeof target === 'string' && fs.existsSync(target)) target = await load(target);

    // if target is an anon function then invoke
    if (typeof target === 'function' && target.name === '') target = (await target()).default;

    // if target is a named function then just reassign
    if (typeof target === 'function' && target.name !== '') target = { module: target };

    // break it up
    const { isESM, file, module } = target;

    // if we dont have a named function at this point we need to log a failure and confinue
    if (typeof module !== 'function' || module.name === '') {
      final.failures.push({ target, error: new Error(`${target} is not a named function, skipping`) });
      return;
    }

    // @NOTE: i dont think "this" works in async functions?
    const ctx = { ...context, debug: debug.contract(-2).extend(`hook:${event}`) };
    const modname = encode(module.name);

    // loop through and execute
    try {
      debug('running %o from %o', modname, file ? `${isESM ? `esm://${file}` : `cjs://${file}`}` : 'function');

      // try to get result
      // @TODO: eventually cli/config are specific to this implementation so they need to be
      // taken out and passed in when we move to the util
      const result = await module.call(ctx, { ...data, ...ctx });
      final.successes.push({ target, result });
      debug('done %o', modname);

      // put errors here?
    } catch (error) {
      final.failures.push({ target, error });
      debug(error);
    }
  });

  // FIRE EVERYTHING!!!
  await Promise.all(promises);
  debug('done %o hook', event);

  // handle errors if that makes sense
  if (errorHandler && final.failures.length > 0) errorHandler(final.failures[0].error);

  // otherwise
  return final;
}
