/**
 * Determine the size/length of various data types.
 *
 * @param {*} data - Value to measure.
 * @returns {number} Size or length of the input.
 */
export default function getSize(data) {
  // if null or undefined return 0
  if (!data || data === null) return 0;
  // if its an array then
  if (Array.isArray(data)) return data.flat(Number.POSITIVE_INFINITY).length;
  // otherwise if its an object
  if (typeof data === 'object') return Object.keys(data).length;
  // otherwise just return the length of whatever it is
  return data.length;
}
