import isObject from 'lodash-es/isPlainObject.js';
import get from 'lodash-es/get.js';
import set from 'lodash-es/set.js';

import getKeys from './get-object-keys.js';
import getSize from './get-size.js';

/**
 * Compute sizes for each key within an object.
 *
 * @param {object} data - Object to measure.
 * @param {object} [options]
 * @param {number} [options.depth=1] - Not currently implemented.
 * @param {object} [options.sizes] - Initial sizes object to populate.
 * @returns {object} Object keyed by path with numeric sizes.
 */
export default function getObjectSize(data, { depth = 1, sizes = {} } = {}) {
  // @TODO: implement depth?
  // @TODO: throw error if data is not object?
  if (!isObject(data)) return {};
  // set all the sizes
  for (const path of getKeys(data, { depth, expandArrays: false })) set(sizes, path, getSize(get(data, path)));
  // return sizes
  return sizes;
}
