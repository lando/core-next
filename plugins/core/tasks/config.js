'use strict';

const _ = require('lodash');

module.exports = (lando, cli) => ({
  command: 'config',
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
  run: options => {
    if (!_.isNil(options.field)) options.path = options.field;
    console.log(cli.formatData(lando.config, options, {sort: true}));
  },
});
