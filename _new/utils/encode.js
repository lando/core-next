import kebabCase from 'lodash-es/kebabCase.js';

import encodeKeys from './encode-keys.js';

// @TODO: throw error for nully values?
/**
 * Encode a value by converting camelCase keys to kebab-case.
 *
 * @param {any} data - Data to encode.
 * @returns {any} Encoded value.
 */
export default function encode(data) {
  // if we have a nully value then just return
  if (data === null || data === undefined) return data;
  // if string then return
  if (typeof data === 'string')
    return data
      .split('.')
      .map((part) => kebabCase(part))
      .join('.');
  // if array then map and return
  if (Array.isArray(data))
    return data.map((prop) =>
      prop
        .split('.')
        .map((part) => kebabCase(part))
        .join('.'),
    );
  // else assume object and return, ignore keys in plugin format
  return encodeKeys(data);
}
