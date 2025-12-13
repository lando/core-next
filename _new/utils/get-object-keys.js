/**
 * Return all object keys as dot-separated paths.
 *
 * @param {object} data - Object to extract keys from.
 * @param {object} [options]
 * @param {string} [options.prefix=''] - Prefix for the returned keys.
 * @param {boolean} [options.expandArrays=true] - Include array indexes.
 * @param {string} [options.separator='.'] - Path separator.
 * @returns {string[]} Array of key paths.
 */
function getObjectKeys(data, { prefix = '', expandArrays = true, separator = '.' } = {}) {
  return Object.keys(data).reduce((keys, key) => {
    // if we have a primitive then return the path
    if (!data[key] || typeof data[key] !== 'object' || Object.keys(data[key]).length === 0) {
      return !key.includes(separator) ? [...keys, `${prefix}${key}`] : [...keys, `${prefix}["${key}"]`];
    }

    // if we arent expanding arrays then dont return paths with array indexes
    if (!expandArrays && Array.isArray(data[key])) {
      return [...keys, `${prefix}${key}`];
    }

    // otherwise cycle through again
    return [...keys, ...getObjectKeys(data[key], { expandArrays, prefix: `${prefix}${key}${separator}` })];
  }, []);
}

export default getObjectKeys;
