/**
 * Normalize an identifier to a single string key.
 *
 * @param {string|string[]} id - Identifier or path array.
 * @param {string} [delimiter='.'] - Delimiter for array joins.
 * @returns {string} Normalized id string.
 */
export default function normalizeId2Key(id, delimiter = '.') {
  // if array then join and return
  if (Array.isArray(id)) return id.join(delimiter);
  // otherwise just return
  return id;
}
