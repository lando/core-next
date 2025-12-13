import camelcaseKeys from 'camelcase-keys';
import isObject from 'lodash-es/isPlainObject.js';

/**
 * Convert the keys of an object to camelCase.
 *
 * @param {any} data - Value to decode.
 * @returns {any} Decoded object or original value if not an object.
 */
export default function decode(data) {
  // return non objects with no mutation
  if (!isObject(data)) return data;
  // mutate keys and return
  return camelcaseKeys(data, { deep: true });
}
