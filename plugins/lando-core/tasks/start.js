'use strict';

const _ = require('lodash');
const utils = require('./../lib/utils');

module.exports = (lando, cli) => {
  return {
    command: 'start',
    describe: 'Starts your app',
    run: options => {
      // Try to get our app
      const app = lando.getApp(options._app.root);
      // Start it if we can!
      if (app) {
        console.log(cli.makeArt('appStart', {name: app.name, phase: 'pre'}));
        // Normal bootup
        return app.start().then(() => {
          const type = !_.isEmpty(app.warnings) ? 'report' : 'post';
          console.log(cli.makeArt('appStart', {name: app.name, phase: type, warnings: app.warnings}));
          console.log(cli.formatData(utils.startTable(app), {format: 'table'}, {border: false}));
          console.log('');
        })
        // Provide help if there is an error
        .catch(err => {
          app.log.error(err.message, err);
          console.log(cli.makeArt('appStart', {phase: 'error'}));
          return lando.Promise.reject(err);
        });
      }
    },
  };
};
