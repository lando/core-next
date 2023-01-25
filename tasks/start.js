'use strict';

// const _ = require('lodash');
// const utils = require('./../lib/utils');

module.exports = () => {
  return {
    command: 'start',
    describe: 'starts your app',
    run: async (options, {cli, context, lando, minapp}) => {
      // @TODO: throw an error if context.app === false or we dont have a minapp?
      // @NOTE: we are assuming

      // @todo: lando/minapp
      // lets get a runHook implementation here?
      // lets add in some basics like start/getInfo/getStatus etc
      // different status checks?
        // can build

      // file storage with an update command?

      // get legacy lando? do we really even need one?
      // does it make more sense to have a "legacify" util?
      // const LegacyLando = minapp.getComponent('legacy.lando');
      // console.log(new LegacyLando(lando))
      // process.exit(1)

      // get the legacy app
      // const LegacyApp = minapp.getComponent('app.legacy-app');
      // console.log(new LegacyApp(minapp));
      // process.exit(1);


      // // Try to get our app
      // const app = lando.getApp(options._app.root);
      // // Start it if we can!
      // if (app) {
      //   console.log(cli.makeArt('appStart', {name: app.name, phase: 'pre'}));
      //   // Normal bootup
      //   return app.start().then(() => {
      //     const type = !_.isEmpty(app.warnings) ? 'report' : 'post';
      //     console.log(cli.makeArt('appStart', {name: app.name, phase: type, warnings: app.warnings}));
      //     console.log(cli.formatData(utils.startTable(app), {format: 'table'}, {border: false}));
      //     console.log('');
      //   })
      //   // Provide help if there is an error
      //   .catch(err => {
      //     app.log.error(err.message, err);
      //     console.log(cli.makeArt('appStart', {phase: 'error'}));
      //     return lando.Promise.reject(err);
      //   });
      // }
    },
  };
};
