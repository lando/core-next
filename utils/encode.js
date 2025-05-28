import encodeKeys from './encode-keys.js';
import kebabCase from 'lodash-es/kebabCase.js';

// @TODO: throw error for nully values?
export default (data) => {
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
};
