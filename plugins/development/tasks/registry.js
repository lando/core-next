'use strict';

module.exports = () => ({
  command: 'registry',
  describe: 'displays the registry for this context',
  run: async (options, {cli, context, lando, minapp}) => {
    cli.log(context.app ? minapp.getRegistry() : lando.getRegistry());
  },
});
