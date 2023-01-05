'use strict';

module.exports = (lando, cli) => {
  return {
    command: 'destroy',
    describe: 'Destroys your app',
    options: {
      yes: cli.confirm('Are you sure you want to DESTROY?'),
    },
    run: options => {
      // Stop rebuild if user decides its a nogo
      if (!options.yes) {
        console.log(cli.makeArt('appDestroy', {phase: 'abort'}));
        return;
      }
      // Try to get our app
      const app = lando.getApp(options._app.root);
      // Destroy the app
      if (app) {
        console.log(cli.makeArt('appDestroy', {name: app.name, phase: 'pre'}));
        return app.destroy().then(() => console.log(cli.makeArt('appDestroy', {name: app.name, phase: 'post'})));
      }
    },
  };
};
