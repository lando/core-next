module.exports = () => ({
  command: 'registry',
  describe: 'displays the registry for this context',
  run: async (options, {cli, context, lando, minapp}) => {
    const registry = context.app ? minapp.getRegistry() : lando.getRegistry();
    cli.log(registry);
  },
});
