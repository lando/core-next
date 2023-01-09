const formats = ['auto', 'inspect', 'json', 'table'];

module.exports = () => ({
  command: 'version',
  describe: 'displays lando version information',
  options: {
    all: {
      describe: 'show all version information',
      alias: ['a'],
      conflicts: ['component', 'short'],
      type: 'boolean',
    },
    component: {
      describe: 'show version info for specific component',
      alias: ['c'],
      conflicts: ['all'],
      type: 'string',
    },
    format: {
      describe: 'output in specified format',
      choices: formats,
      string: true,
      default: 'auto',
    },
    short: {
      describe: 'show only version string',
      alias: ['s'],
      conflicts: ['all'],
      type: 'boolean',
    },
  },
  run: async (options, {cli, context, lando, minapp}) => {
    const util = require('util');

    // lets just start with the CLI version
    const config = context.app ? minapp.config : lando.config;
    const plugins = (context.app ? minapp.getPlugins() : lando.getPlugins());
    let data = {'@lando/cli': `v${config.get('system.version')}`};

    // if all then add in all the plugin data
    if (options.all) for (const [name, plugin] of Object.entries(plugins)) data[name] = plugin.version;
    // if we are looking for a different component than cli
    if (options.component && (options.component !== 'cli' || options.compoent !== '@lando/cli')) {
      const componentKey = Object.keys(plugins).find(name => name === options.component || name === `@lando/${options.component}`);
      // throw error if cannot find component
      if (!componentKey) {
        cli.error(`Could not find a component named: "${options.component}"`, {
          suggestions: ['Run lando version --all for a full list of components'],
          ref: 'https://docs.lando.dev/cli/version.html',
          exit: 3,
        });
      }
      // set the data
      data = {[componentKey]: `v${plugins[componentKey].version}`};
    }
    // if we only are looking for one thing and want short then just value
    if (options.short && Object.keys(data).length === 1) data = Object.values(data)[0];

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

    // if we get here then we are in "auto" mode which we can game out
    // if we just have a string then print it
    if (typeof data === 'string') {
      cli.log(data);
      return;
    }

    // if we have a one key object then just combine and print as string
    if (Object.keys(data).length === 1) {
      cli.log(`${Object.keys(data)[0]} ${Object.values(data)[0]}`);
      return;
    }

    // otherwise we should print a table
    // if we have selected all then just print them all in a table
    const rows = Object.entries(data).map(([name, version]) => ({name, version: `v${version}`}));
    cli.log();
    cli.ux.ux.table(rows, {name: {}, version: {}});
    cli.log();
  },
});
