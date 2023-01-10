module.exports = () => ({
  command: 'plugins',
  describe: 'displays the plugins for this context',
  run: async (options, {cli, context, lando, minapp}) => {
    const plugins = context.app ? minapp.getPlugins() : lando.getPlugins();
    cli.log(plugins);
  },
});
