'use strict';

// Modules
const _ = require('lodash');

// Default env values
const defaults = {
  config: {
    appEnv: {
      COLUMNS: 256,
      LANDO: 'ON',
      LANDO_WEBROOT_USER: 'www-data',
      LANDO_WEBROOT_GROUP: 'www-data',
      TERM: 'xterm',
    },
    appLabels: {
      'io.lando.container': 'TRUE',
    },
  },
};

/*
 * Helper to get user conf
 */
const uc = (uid, gid, username) => ({
  config: {
    appEnv: {
      LANDO_HOST_UID: uid,
      LANDO_HOST_GID: gid,
      LANDO_HOST_USER: username,
    },
    gid,
    uid,
    username,
  },
});

module.exports = lando => {
  // Return some default things
  return _.merge({}, defaults, uc(lando.user.getUid(), lando.user.getGid(), lando.user.getUsername()), {config: {
    appEnv: {
      LANDO_CONFIG_DIR: lando.config.userConfRoot,
      LANDO_DOMAIN: lando.config.domain,
      LANDO_HOST_HOME: lando.config.home,
      LANDO_HOST_OS: lando.config.os.platform,
      // @TODO: this probably should be implemented by the engine?
      // LANDO_HOST_IP: (process.platform === 'linux') ? ip.address() : 'host.docker.internal',
      // LANDO_LEIA: _.toInteger(lando.config.leia),
      LANDO_MOUNT: '/app',
    },
    appLabels: {
      'io.lando.id': lando.config.instance,
    },
  }});
};
