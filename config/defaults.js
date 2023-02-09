'use strict';

const os = require('os');
const path = require('path');
const getContext = require('./../utils/get-context');
const getSysDataPath= require('./../utils/get-system-data-dir');

module.exports = ({options}) => {
  // get stuff we need from options
  const {id, env} = options;

  // compute some system things
  const home = os.homedir();
  const baseDir = path.join(home, `.${id}`);
  const cacheDir = path.join(baseDir, 'cache');
  const configDir = path.join(baseDir, 'config');
  const dataDir = path.join(baseDir, 'data');
  const logsDir = path.join(baseDir, 'logs');
  const syscacheDir = path.join(baseDir, 'syscache');

  const errlog = path.join(logsDir, 'error.log');

  // get versions
  const pjson = require(path.resolve(__dirname, '..', 'package.json'));

  // get other stuff
  const context = getContext();
  const user = os.userInfo();

  // return the system config
  return {
    core: {
      app: 'app',
      caching: true,
      debug: false,
      engine: context === 'local' ? 'docker-desktop' : 'docker-engine',
      pluginInstaller: 'docker-plugin-installer',
      releaseChannel: 'stable',
      storage: 'file-storage',
      telemetry: true,
    },
    plugin: {
      showCore: true,
      // these are "additional" directories to scan for plugins on top of the "core/internal" that are loaded no
      // matter what
      dirs: {
        system: {
          type: 'global',
          dir: path.join(getSysDataPath(id), 'system', 'plugins'),
          depth: 2,
        },
        global: {
          type: 'global',
          dir: path.join(getSysDataPath(id), 'global', 'plugins'),
          depth: 2,
        },
        userCore: {
          type: 'user',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next'),
          depth: 0,
        },
        userCorePlugins: {
          type: 'user',
          dir: path.join(dataDir, 'plugins', '@lando', 'core-next', 'plugins'),
          depth: 2,
        },
        user: {
          type: 'user',
          dir: path.join(dataDir, 'plugins'),
          depth: 2,
        },
      },
    },
    registry: {},
    system: {
      arch: os.arch(),
      cacheDir,
      configDir,
      context: context,
      dataDir,
      env,
      errlog,
      freemem: os.freemem() / 1_073_741_824,
      gid: user.gid,
      home,
      id: id || 'lando',
      interface: 'none',
      logsDir,
      mode: 'lib',
      platform: process.platform,
      product: id || 'lando',
      root: path.resolve(__dirname, '..'),
      runtime: 4,
      server: 'node',
      syscacheDir,
      totalmem: os.totalmem() / 1_073_741_824,
      version: pjson.version,
      windows: process.platform === 'win32',
      uid: user.uid,
      user: user.username,
      userAgent: `${pjson.name}/${pjson.version} ${process.platform}-${process.arch} node-${process.version}`,
    },
    updates: {
      notify: true,
    },
  };
};
