'use strict';

module.exports = async (app, lando) => {
  app.log('removing metadata cache...');
  lando.cache.remove(app.metaCache);
};
