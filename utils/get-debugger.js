'use strict';

/*
 * TBD
 */
module.exports = (namespace, {extend, offset = 0} = {}) => {
  // if no extend then just return the usual debugger
  if (!extend) return require('debug')(namespace);

  // otherwise do some more complex stuff
  // throw error if extend is not a debugger
  // @TODO: better error message
  if (typeof extend !== 'function' || extend.name !== 'debug') {
    throw new Error('does not appear to be a valid debugger!');
  }

  // if offset is > 0 and we have a namespace then splice and return
  if (offset < 0 && typeof extend.namespace === 'string') {
    return require('debug')(extend.namespace
      .split(':')
      .splice(offset)
      .concat(namespace)
      .filter(Boolean)
      .join(':'));
  }

  // otherwise just extend and return
  return extend.extend(namespace);
};
