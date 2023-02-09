'use strict';

const App = require('../lib/app');

class CliApp extends App {
  static debug = require('../lib/debug')('@lando/core:cli-app');

  constructor(config) {
    // provide a debug default if we dont have one?
    config.debug = config.debug || App.debug;
    super(config);
  }
}

module.exports = CliApp;
