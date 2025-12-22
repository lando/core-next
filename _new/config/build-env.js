import path from 'node:path';
import url from 'node:url';

import getCommitHash from '../utils/get-commit-hash.js';
import isDevVersion from '../utils/is-dev-version.js';

import { version } from '../../package.json';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/* eslint-disable no-undef */
export const BUILD_IS_COMPILED = typeof __BUILD_IS_COMPILED__ !== 'undefined' ? __BUILD_IS_COMPILED__ : false;

export const BUILD_COMMIT =
  typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : getCommitHash(path.resolve(__dirname, '..', '..'), { short: true });

export const BUILD_DEV = typeof __BUILD_DEV__ !== 'undefined' ? __BUILD_DEV__ : isDevVersion(version);

export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

export const BUILD_VERSION = typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : version;
/* eslint-enable no-undef */

export default { BUILD_IS_COMPILED, BUILD_COMMIT, BUILD_DEV, BUILD_TIME, BUILD_VERSION };
