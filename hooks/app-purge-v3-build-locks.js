'use strict';

module.exports = async (app, lando) => {
  lando.cache.remove(app.preLockfile);
  lando.cache.remove(app.postLockfile);
  app.log('removed v3 build locks');
};
