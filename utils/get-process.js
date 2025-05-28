/*
 * TBD
 */
export default () => {
  // probably running in a browser
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') return 'browser'; // eslint-disable-line no-undef
  // probable running as a cli
  if (typeof process !== 'undefined' && process?.versions != null && process?.versions?.node != null) return 'node';
  // no idea
  return 'unknown';
};
