/**
 * Identify the runtime environment type.
 *
 * @returns {string} 'browser', 'node', or 'unknown'.
 */
export default function getProcess() {
  // probably running in a browser
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') return 'browser'; // eslint-disable-line no-undef
  // probable running as a cli
  if (typeof process !== 'undefined' && process?.versions != null && process?.versions?.node != null) return 'node';
  // no idea
  return 'unknown';
}
