'use strict';

module.exports = cli => ({
  command: 'stuff2',
  level: 'tasks',
  describe: 'Tests another app loaded plugin',
  run: () => {
    cli.log('I WORKED!');
  },
});
