import createDebug from '../lib/debug.js';
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
export default async function runHook(event, data, hooks = [], context = {}, debug = createDebug('devtool:run-hooks'), errorHandler) {
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
    // if this is not a group then make it a group of one
    if (typeof target === 'string') target = [target];

    // @NOTE: i dont think "this" works in async functions?
    const ctx = { ...context, debug: debug.contract(-2).extend(`hook:${event}`) };

    // loop through stringy existy runners and try to get results
    for (const runner of target.filter((runner) => runner && typeof runner === 'string')) {
      try {
        const { isESM, module, file } = await load(runner);
        debug('start %s %o', isESM ? '(import)' : '(require)', file);
        // try to get result
        // @TODO: eventually cli/config are specific to this implementation so they need to be
        // taken out and passed in when we move to the util
        const result = await module.call(ctx, { ...data, ...ctx });
        final.successes.push({ target, result });
        debug('done %o', file);

        // put errors here?
      } catch (error) {
        final.failures.push({ target, error });
        debug(error);
      }
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
