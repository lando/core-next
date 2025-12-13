/**
 * Normalize plugin definitions into an object keyed by a property.
 *
 * @param {object[]|object} plugins - Plugins list or map.
 * @param {string} [by='name'] - Key to index array entries by.
 * @returns {object} Normalized plugin map.
 */
export default function normalizePlugins(plugins, by = 'name') {
  // if its an array then map to an object
  if (Array.isArray(plugins)) {
    return Object.fromEntries(plugins.map((plugin) => [plugin[by], plugin]));
  }

  // @TODO: should we standarize the result?
  // @TODO: what about an object?
  // @TODO: other conditions?
  return plugins;
}
