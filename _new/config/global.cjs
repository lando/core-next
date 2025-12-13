/* eslint-disable import/no-commonjs */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const which = require('which');

module.exports = (options) => {
  // 0 0 0 destruct 0
  const { bin, cache, cacheDir, configDir, coreDir, dataDir, env, errlog, name, id, root, shell, version } = options;

  // get other stuff
  const logsDir = path.join(dataDir, 'logs');
  const syscacheDir = path.resolve(cacheDir, '..', `${id}.system`);

  // create dirs
  fs.mkdirSync(path.dirname(logsDir), { recursive: true });

  // return the CLI system config
  return {
    core: {
      app: 'appfile-app',
      minapp: 'appfile-minapp',
      caching: cache,
    },
    plugin: {
      dirs: [
        {
          id: 'cli',
          dir: path.resolve(__dirname, '..'),
          depth: 0,
          weight: -100,
        },
      ],
    },
    system: {
      bin,
      cacheDir,
      configDir,
      coreDir,
      dataDir,
      dev: !Object.hasOwn(process, 'pkg'),
      env,
      errlog,
      interface: 'cli',
      leia: Object.hasOwn(process.env, 'LEIA_PARSER_RUNNING'),
      logsDir,
      bun: process.versions.bun,
      mode: 'cli',
      packaged: Object.hasOwn(process, 'pkg'),
      root,
      shell: which.sync(shell, { nothrow: true }),
      syscacheDir,
      version,
      userAgent: `${name}/${version} ${os.platform()}-${os.arch()} bun-${process.versions.bun}`,
    },
    updates: {
      notify: true,
    },
    // dockerDesktop: {
    //   required: '>=3.6.5 && <=5.0.0',
    //   scripts: path.resolve(root, 'scripts', 'docker-desktop'),
    //   server: {
    //     socketPath: (platform === 'win32') ? '//./pipe/docker_engine' : '/var/run/docker.sock',
    //     // host: '192.168.1.10',
    //     // port: process.env.DOCKER_PORT || 2375,
    //     // ca: fs.readFileSync('ca.pem'),
    //     // cert: fs.readFileSync('cert.pem'),
    //     // key: fs.readFileSync('key.pem'),
    //     // version: 'v1.25',
    //   },
    //   supported: '>=3.6.5 && <=4.10.5',
    //   // npmrc: '//npm.pkg.github.com/:_authToken=GH_ACCESS_TOKEN\n@namespace:registry=https://npm.pkg.github.com',
    // },
    // dockerEngine: {
    // required: '>=3.6.5 && <=5.0.0',
    // scripts: path.resolve(root, 'scripts', 'docker-desktop'),
    // server: {
    //   socketPath: (platform === 'win32') ? '//./pipe/docker_engine' : '/var/run/docker.sock',
    //   // host: '192.168.1.10',
    //   // port: process.env.DOCKER_PORT || 2375,
    //   // ca: fs.readFileSync('ca.pem'),
    //   // cert: fs.readFileSync('cert.pem'),
    //   // key: fs.readFileSync('key.pem'),
    //   // version: 'v1.25',
    // },
    // supported: '>=3.6.5 && <=4.10.5',
    // },
    // dockerPluginInstaller: {
    //   image: 'node:16-alpine',
    // },
    // Allows you to pass env value to Docker, Docker Compose, etc.
    // @TODO: figure out how to implement this exactly
    // env: {},
  };
};
