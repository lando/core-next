'use strict';

module.exports = cli => ({
  command: 'stuff',
  level: 'tasks',
  describe: 'Tests an app loaded plugin',
  run: () => {
    cli.log('I WORKED!');
  },
});
