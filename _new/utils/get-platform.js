import os from 'node:os';

/**
 * Determine the current operating system platform.
 *
 * @returns {string} Platform identifier (`darwin`, `linux`, `win32`, or `wsl`).
 */

export default function getPlatform() {
  // wsl check
  if (os.platform() === 'linux' && os.release().toLowerCase().includes('microsoft')) return 'wsl';
  // otherwise this
  return os.platform();
}
