'use strict';

const ModuleLoader = require('@oclif/core/lib/module-loader').default;

/*
 * TBD
 */
module.exports = async (event, data, hooks = [], context = {}, debug = require('../lib/debug')('@lando/core'), errorHandler) => {
  // debugger
  debug = debug.extend(`run-hook:${event}`);
  // just helpful message to indicate we have started a cli hook
  debug('start %o hook', event);
  // collect successes and failures
  const final = {successes: [], failures: []};

  // generate promises from hooks
  const promises = hooks.map(async group => {
    // @NOTE: i dont think "this" works in async functions?
    const ctx = {...context, debug: debug.contract(-2).extend(`plugin:${group.name || group.id}`)};
    // get all the runner for this group
    const runners = group.hooks && group.hooks[event] && Array.isArray(group.hooks[event]) ? group.hooks[event] : [];
    // loop through runners and try to get results
    for (const runner of runners) {
      try {
        const {isESM, module, filePath} = await ModuleLoader.loadWithData(group, runner);
        debug('start %s %o', isESM ? '(import)' : '(require)', filePath);
        // try to get result
        // @TODO: eventually cli/config are specific to this implementation so they need to be
        // taken out and passed in when we move to the util
        const result = await module.call(ctx, {...data, ...ctx});
        final.successes.push({group, result});
        debug('done %o', filePath);

      // put errors here?
      } catch (error) {
        final.failures.push({group, error});
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
};
