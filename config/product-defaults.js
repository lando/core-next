'use strict';

const os = require('os');
const path = require('path');
const getContext = require('../utils/get-context');
const getSysDataPath = require('../utils/get-system-data-dir');

module.exports = options => {
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
    test: ['one', 'two'],
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
      dirs: [
        // these are internal plugins
        {
          id: 'core',
          dir: path.join(__dirname, '..'),
          depth: 0,
        },
        {
          id: 'core-plugins',
          dir: path.join(__dirname, '..', 'plugins'),
          depth: 2,
        },
        {
          thing: 'ok',
        },

        // these should be globally loaded and avialable to all users
        {
          id: 'system',
          dir: path.join(getSysDataPath(id), 'system', 'plugins'),
          depth: 2,
        },
        {
          id: 'global',
          dir: path.join(getSysDataPath(id), 'global', 'plugins'),
          depth: 2,
        },

        // these are to handle "updates" to @lando/core
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

        // this is the users global plugins directory
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
