import os from 'node:os';
import path from 'node:path';

import getEnvironment from './get-environment.js';
import getPlatform from './get-platform.js';

const env = getEnvironment();
const platform = getPlatform();

const getOClifHome = () => {
  switch (platform) {
    case 'darwin':
    case 'linux':
    case 'wsl':
      return env.HOME ?? os.homedir() ?? os.tmpdir();
    case 'win32':
      return (
        env.HOME ||
        (env.HOMEDRIVE && env.HOMEPATH && path.join(env.HOMEDRIVE, env.HOMEPATH)) ||
        env.USERPROFILE ||
        os.homedir() ||
        os.tmpdir()
      );
  }
};

/*
 * Get oclif base dir based on platform
 */
const getOClifBase = (product) => {
  const base = env['XDG_CACHE_HOME'] || (platform === 'win32' && env.LOCALAPPDATA) || path.join(getOClifHome(), '.cache');
  return path.join(base, product);
};

const macosCacheDir = (product) => {
  return platform === 'darwin' ? path.join(getOClifHome(), 'Library', 'Caches', product) : undefined;
};

/**
 * Determine the cache directory for the given product.
 *
 * @param {string} [product='devtool'] - Product identifier used to compute the directory.
 * @returns {string} The cache directory path.
 */
export default function getCacheDir(product = 'devtool') {
  return env[`${product.toUpperCase()}_CACHE_DIR`] ?? macosCacheDir(product) ?? getOClifBase(product);
}
