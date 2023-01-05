'use strict';

const _ = require('lodash');

module.exports = (lando, cli) => ({
  command: 'registry',
  level: 'tasks',
  describe: 'Displays the lando configuration',
  options: _.merge({}, cli.formatOptions(['filter']), {
    // @NOTE: This is for backwards compat and needs to be removed
    field: {
      describe: 'Show only a specific field',
      hidden: true,
      string: true,
    },
  }),
  run: async (options, {cli, lando, debug}) => {
    // if (!_.isNil(options.field)) options.path = options.field;
    // console.log(cli.formatData(lando.config, options, {sort: true}));
    cli.log(lando.getRegistry());
  },
});
