'use strict';

module.exports = cli => ({
  command: 'plugins',
  describe: 'displays the plugins for this context',
  run: async (options, {ctx}) => {
    const plugins = ctx.getPlugins();
    cli.ux.ux.table(
      Object.entries(plugins).map(([name, plugin]) => ({name, version: plugin.version, location: plugin.location})),
      {name: {}, version: {}, location: {}},
    );
  },
});
