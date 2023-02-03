'use strict';

// normal debug module with some extra helper funcs
module.exports = namespace => {
  // get the normal debugger
  const debug = require('debug')(namespace);

  // this does the opposite of extend, moves the namespace back by size delimiter
  debug.contract = size => module.exports(debug.namespace.split(':').slice(0, Math.abs(size) * -1).join(':'));

  // keep the old extend
  debug._extend = debug.extend;
  // shallow wrapper just so debug.extend gives us contract and replace as well
  debug.extend = more => module.exports([debug.namespace, more].join(':'));

  // replaces the string or component piece
  // @NOTE: this assumes a first value of 1 and not 0
  // @NOTE: but should we assume that?
  // @TODO: error handling?
  debug.replace = (replacee, replacer) => {
    // if either replacee or replacer are undefrined then return the same
    if (!replacee || !replacer) return debug;

    // if replacee is an integer then replace but assume we start at 1
    if (Number.isInteger(replacee)) {
      const parts = debug.namespace.split(':');
      parts[replacee - 1] = replacer;
      return module.exports(parts.join(':'));

    // just do a simple string replacement
    } else if (typeof replacee === 'string') {
      return module.exports('debug')(debug.namespace.replace(replacee, replacer));
    }

    // return
    return debug;
  };

  return debug;
};
