'use strict';

module.exports = async (app, lando) => {
  app.log('removing recipe cache...');
  lando.cache.remove(app.recipeCache);
};
