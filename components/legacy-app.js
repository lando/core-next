'use strict';

const AppFileApp = require('../components/appfile-app');

class LandoLegacyApp extends AppFileApp {
  static debug = require('../lib/debug')('@lando/core:legacy-app');
  static name = 'legacy-app';

  constructor({
    appfile,
    config,
    product,
    plugins = {},
    debug = LandoLegacyApp.debug,
  } = {}) {
    // @TODO:
    // throw error if no name?
    // throw error if config is no good
    // do we need an appfiles prop? throw error if we do?

    // invoke super
    super({appfile, config, product, plugins, debug});
  }
}

module.exports = LandoLegacyApp;
