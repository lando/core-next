import chalk from 'chalk';
import createDebug from '../lib/debug.js';
import encode from './encode.js';
import loadComponent from './load-component.js';

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
  // collect successes and failures
  const final = { successes: [], failures: [] };
  // just helpful message to indicate we have started a cli hook
  debug('start %s hook group', chalk.green(event));
  // get targets
  const groups = hooks[event] ?? [];
  const targets = groups.map((group) => group.target ?? group);

  // generate promises from hooks
  const promises = targets.map(async (target) => {
    // @TODO:  test error handler (allow quiet fail?)
    const hook = await loadComponent(target);

    // if we dont have a named function at this point we need to log a failure and confinue
    if (typeof hook !== 'function' || hook.name === '') {
      final.failures.push({ hook, error: new Error(`${hook.name ?? hook} is not a named function, skipping`) });
      return;
    }

    // get hookname and debugger
    const hookname = encode(hook.name);
    const hookdebug = debug.extend(hookname);

    // @NOTE: i dont think "this" works in async functions?
    const ctx = { ...context, debug: hookdebug };

    // loop through and execute
    try {
      hookdebug('%s', chalk.green('started'));

      // try to get result
      // @TODO: eventually cli/config are specific to this implementation so they need to be
      // taken out and passed in when we move to the util
      const result = await hook.call(ctx, { ...data, ...ctx });
      final.successes.push({ target, result });
      hookdebug('%s', chalk.magenta('finished'));

      // put errors here?
    } catch (error) {
      final.failures.push({ target, error });
      debug(error);
    }
  });

  // FIRE EVERYTHING!!!
  await Promise.all(promises);
  debug('end %s hook group', chalk.magenta(event));

  // handle errors if that makes sense
  if (errorHandler && final.failures.length > 0) errorHandler(final.failures[0].error);

  // otherwise
  return final;
}
