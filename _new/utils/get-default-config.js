import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import isInteractive from 'is-interactive';
import isRoot from 'is-root';

import getContext from './get-context.js';
import getPlatform from './get-platform.js';
import getProcess from './get-process.js';
import getSystemDataDir from './get-system-data-dir.js';
import isWslInteropt from './is-wsl-interopt.js';
import read from './read-file.js';
import traverseUp from './traverse-up.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * Generate a baseline configuration object for the given product.
 *
 * @param {string} [id='devtool'] - Product identifier.
 * @returns {object} Default configuration values.
 */
export default function getDefaultConfig(id = 'devtool') {
  // compute some system things
  const home = os.homedir();
  const baseDir = path.join(home, `.${id}`);
  const cacheDir = path.join(baseDir, 'cache');
  const configDir = path.join(baseDir, 'config');
  const dataDir = path.join(baseDir, 'data');
  const logsDir = path.join(baseDir, 'logs');
  const syscacheDir = path.join(baseDir, 'syscache');
  const sysdataDir = getSystemDataDir(id);

  const errlog = path.join(logsDir, 'error.log');

  // find the root of core and retrieve info
  const root = path.dirname(traverseUp(['package.json'], __dirname).find(fs.existsSync));
  const pjson = read(path.join(root, 'package.json'));

  // get other stuff
  const platform = getPlatform();
  const user = os.userInfo();

  return {
    core: {
      app: 'app',
      appfile: '.devtool',
      appfiles: ['base', 'dist', 'recipe', 'upstream', '', 'local', 'user'],
      caching: true,
      minapp: 'minapp',
    },
    // @TODO: revist this?
    // @TODO: do we even need core stuff in here since we have a recombined cli?
    plugin: {
      dirs: [
        {
          id: 'core-updates',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next'),
          depth: 0,
        },
        {
          id: 'core-plugins-updates',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next', 'plugins'),
          depth: 2,
        },
        {
          id: 'user',
          dir: path.join(dataDir, 'plugins'),
          depth: 2,
        },
      ],
    },
    system: {
      arch: os.arch(),
      cacheDir,
      configDir,
      coreDir: root,
      context: getContext(),
      dataDir,
      env: id.toUpperCase(),
      errlog,
      freemem: os.freemem() / 1_073_741_824,
      gid: user.gid,
      home,
      id,
      isInteractive: isInteractive(),
      isRoot: isRoot(),
      isWslInterop: isWslInteropt(),
      interface: 'lib',
      linux: platform === 'linux',
      logsDir,
      macos: platform === 'darwin',
      mode: 'lib',
      os: os.platform(),
      platform,
      product: id,
      process: getProcess(),
      root,
      syscacheDir,
      sysdataDir,
      totalmem: os.totalmem() / 1_073_741_824,
      version: pjson.version,
      windows: platform === 'win32',
      wsl: platform === 'wsl',
      uid: user.uid,
      user: user.username,
      userAgent: `${pjson.name}/${pjson.version} ${os.platform()}-${os.arch()}`,
    },
    updates: {
      notify: true,
      // channel?
      // enavled?
    },
  };
}
