'use strict';

const Product = require('../lib/product');

/**
 * @NOTE: the purpose of the minapp is something we can just new MinApp() without a helper async load/init function
 * it should quickly return and give us "all the things we need which is TBD" for hyperdrive that would be
 * just assembling the landofile config, plugins, etc, for lando that might also include being able to exec a command
 * @NOTE: does this min minapp lacks any ASYNC init like engine/plugin etc? what happens when the assembled config is not
 * complete eg has not gone through app init? maybe an init: false prop?
 *
 * @TODO: lots of the config loading makes sense in the constructor EXCEPT for selecting the relevant app component
 * to use, that needs to be done outside of this but how do we do that? probably in the load app util function?
 */
class Lando extends Product {
  static name = 'lando';
  static debug = require('../lib/debug')('@lando/core:lando');

  constructor(config) {
    // provide a debug default if we dont have one?
    config.debug = config.debug || Lando.debug;
    super(config);
  }
}

module.exports = Lando;
