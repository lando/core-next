import isObject from 'lodash-es/isPlainObject.js';
import merge from 'lodash-es/merge.js';

// @TODO: error handling
/**
 * Merge two arrays using a variety of strategies.
 *
 * @param {Array} a - Base array.
 * @param {Array} b - Array to merge into `a`.
 * @param {string} [ams='replace'] - Strategy string, e.g. 'merge:id'.
 * @returns {Array} The merged array.
 */
export default function mergeArrays(a, b, ams = 'replace') {
  // get strat and id if applicable
  const strategy = ams.split(':')[0];
  const by = ams.split(':')[1] || 'id';

  switch (strategy) {
    case 'aoa':
      return a.length === 1 ? [a, b] : [...a, b];
    case 'concat':
      return a.concat(b);
    case 'first':
      return a;
    case 'last':
      return b;
    case 'merge':
      return Object.entries(
        [a, b].filter(Boolean).reduce((acc, datum) => {
          return merge(
            acc,
            Object.fromEntries(
              datum.map((a) => {
                // if an object do fancy stuff
                if (isObject(a)) {
                  if (Object.hasOwn(a, by)) return [a[by], a];
                  if (Object.keys(a).length === 1) return [Object.keys(a)[0], a];
                }
                // otherwise just return pairself
                return [a, a];
              }),
            ),
          );
        }, {}),
      ).map((data) => data[1]);
    case 'replace':
    default:
      return merge(a, b);
  }
}
