import os from 'node:os';

/**
 * Convert data structures into human friendly strings.
 *
 * @param {*} data - Data to prettify.
 * @param {object} [options]
 * @param {string} [options.arraySeparator=', '] - Delimiter for string arrays.
 * @returns {string|*} Prettified data or original value.
 */
export default function prettify(data, { arraySeparator = ', ' } = {}) {
  // if undefined then just return an empty string
  if (data === undefined) return '';

  // handle arrays differently
  if (Array.isArray(data)) {
    // join lists of strings together
    if (typeof data[0] === 'string') {
      return data.join(arraySeparator);
    }

    // print arrays of objects nicely
    if (data[0] && typeof data[0] === 'object' && Object.keys(data[0]).length > 0) {
      return data
        .map((item) => {
          // if it doesnt have keys just return
          if (typeof item !== 'object') return item;
          // otherwise
          return Object.keys(item)
            .map((key) => `${key}: ${item[key]}`)
            .join(', ');
        })
        .join(os.EOL);
    }
  }

  return data;
}
