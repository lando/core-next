// @TODO: figure a better default value for legacy-logger?
module.exports = (debug = require('debug')('legacy-logger')) => ({
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
});
