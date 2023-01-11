module.exports = () => ({
  command: 'plugins',
  describe: 'displays the plugins for this context',
  run: async (options, {cli, context, lando, minapp}) => {
    const plugins = context.app ? minapp.getPlugins() : lando.getPlugins();
    cli.ux.ux.table(
      Object.entries(plugins).map(([name, plugin]) => ({name, version: plugin.version, location: plugin.location})),
      {name: {}, version: {}, location: {}},
    );
  },
});
