/*
 * TBD
 */
import os from 'node:os';

export default () => {
  // wsl check
  if (os.platform() === 'linux' && os.release().toLowerCase().includes('microsoft')) return 'wsl';
  // otherwise this
  return os.platform();
};
