'use strict';

const formats = ['auto', 'inspect', 'json', 'table'];

module.exports = cli => ({
  command: 'config',
  describe: 'displays the lando configuration',
  options: {
    field: {
      hidden: true,
      string: true,
    },
    format: {
      describe: 'output in specified format',
      choices: formats,
      string: true,
      default: 'auto',
    },
    path: {
      describe: 'show value at given path',
      string: true,
    },
  },
  run: async (options, {ctx}) => {
    // mods and deps
    const sortBy = require('lodash/sortBy');
    const util = require('util');

    // map over legacy options
    if (options.field) options.path = options.field;

    // start by just grabbing everything or a single value
    const data = options.path ? ctx.config.getUncoded(options.path) : ctx.config.getUncoded();

    // filter out protected config by default
    // if (typeof data === 'object' && !flags.protected) delete data.system;

    // if the data is not an object then just print the result
    if (typeof data !== 'object' || data === null) {
      cli.log(data);
      return;
    }

    // if data is undefined then throw an error
    if (options.path && (data === undefined || Object.keys(data).length === 0)) {
      cli.exitError(`No configuration found for path: "${options.path}"`, {
        suggestions: ['Run lando config for a full list of keys'],
        ref: 'https://docs.lando.dev/cli/config.html#get',
      });
    }

    // if the user wants json then just return the data
    if (options.format === 'json') {
      cli.log(JSON.stringify(data));
      return;
    }

    // if the user wants inspect format then thats next
    if (options.format === 'inspect') {
      cli.log(util.inspect(data, {colors: process.stdout.isTTY, depth: 10, compact: true}));
      return;
    }

    // otherwise construct some rows for tabular display
    const rows = ctx.Config.keys(data, {expandArrays: false}).map(key => {
      // if we have a path then we need to modify the key
      if (options.path) key = `${options.path}.${key}`;
      // start with the basics
      const row = {key, value: ctx.config.getUncoded(key)};
      // also loop through and add the values from each store for use in --extended
      for (const store of Object.keys(ctx.config.stores)) {
        row[store] = ctx.config.getUncoded(`${store}:${key}`);
      }

      return row;
    });

    // construct the column options
    const columns = {key: {}, value: {get: row => cli.prettify(row.value)}};
    // also loop through and add the values from each store for use in --extended
    // @NOTE: this will not add stores with no content
    for (const [name, store] of Object.entries(ctx.config.stores)) {
      if (Object.keys(store.store).length > 0) {
        columns[name] = {get: row => cli.prettify(row[name]), extended: true};
      }
    }

    // print table
    cli.log();
    cli.ux.ux.table(sortBy(rows, 'key'), columns);
    cli.log();
  },
});
