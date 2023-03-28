'use strict';

const ModuleLoader = require('../lib/module-loader');

/*
 * TBD
 */
module.exports = async (event, data, hooks = [], context = {}, debug = require('../lib/debug')('@lando/core'), errorHandler) => {
  // debugger
  debug = debug.extend(`run-hook:${event}`);
  // collect successes and failures
  const final = {successes: [], failures: []};
  // just helpful message to indicate we have started a cli hook
  debug('start %o hook', event);
  // get hooks
  const groups = hooks[event] || [];
  // generate promises from hooks
  const promises = groups.map(async group => {
    // if this is not a group then make it a group of one
    if (typeof group === 'string') group = [group];

    // @NOTE: i dont think "this" works in async functions?
    const ctx = {...context, debug: debug.contract(-2).extend(`hook:${event}`)};

    // loop through stringy existy runners and try to get results
    for (const runner of group.filter(runner => runner && typeof runner === 'string')) {
      try {
        const {isESM, module, filePath} = await ModuleLoader.load(runner);
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
