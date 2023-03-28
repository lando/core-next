'use strict';

/*
 * TBD
 */
module.exports = data => {
  // if null or undefined return 0
  if (!data || data === null) return 0;
  // if its an array then
  if (Array.isArray(data)) return data.flat(Number.POSITIVE_INFINITY).length;
  // otherwise if its an object
  if (typeof data === 'object') return Object.keys(data).length;
  // otherwise just return the length of whatever it is
  return data.length;
};
