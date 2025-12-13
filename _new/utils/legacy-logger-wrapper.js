import createDebug from '../lib/debug.js';

/**
 * Wrap a debug instance with methods shaped like a legacy logger.
 *
 * @param {Function} [debug=createDebug('legacy-logger')] - Debug creator.
 * @returns {object} Logger with log-level methods.
 */
// @TODO: figure a better default value for legacy-logger?
export default function legacyLogWrapper(debug = createDebug('legacy-logger')) {
  return {
    error: (...args) => {
      const log = debug.extend('error');
      log(...args);
    },
    warn: (...args) => {
      const log = debug.extend('warn');
      log(...args);
    },
    info: (...args) => {
      const log = debug.extend('info');
      log(...args);
    },
    verbose: (...args) => {
      const log = debug.extend('verbose');
      log(...args);
    },
    debug: (...args) => {
      const log = debug.extend('debug');
      log(...args);
    },
    silly: (...args) => {
      const log = debug.extend('silly');
      log(...args);
    },
  };
}
