import isObject from 'lodash-es/isPlainObject.js';
import kebabcaseKeys from 'kebabcase-keys';

/**
 * Convert object keys to kebab-case.
 *
 * @param {any} data - Data to encode.
 * @returns {any} Encoded value.
 */
export default function encodeKeys(data) {
  // return non objects with no mutation
  if (!isObject(data)) return data;
  // mutate keys and return unless the key is in plugin format
  return kebabcaseKeys(data, { deep: true, exclude: [new RegExp('(^@).*/')] });
}
