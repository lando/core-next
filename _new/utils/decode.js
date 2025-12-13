import camelCase from 'lodash-es/camelCase.js';
import camelcaseKeys from 'camelcase-keys';

// @TODO: throw error for nully values?
/**
 * Decode dotted or object keys to camelCase.
 *
 * @param {any} data - Data to decode.
 * @returns {any} Decoded value.
 */
export default function decode(data) {
  // if we have a nully value then just return
  if (data === null || data === undefined) return data;
  // if string then return
  if (typeof data === 'string')
    return data
      .split('.')
      .map((part) => camelCase(part))
      .join('.');
  // if array then map and return
  if (Array.isArray(data))
    return data.map((prop) =>
      prop
        .split('.')
        .map((part) => camelCase(part))
        .join('.'),
    );
  // else assume object and return
  return camelcaseKeys(data, { deep: true });
}
