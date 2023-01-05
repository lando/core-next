const path = require('path');

module.exports = config => {
  const plugin = {
    name: '@lando/dev',
    registry: {legacy: {}},
  };

  // if devmode is on then add things to the registry for use
  if (config.core.devMode) {
    plugin.registry.legacy.tasks = {
      'registry': path.resolve(__dirname, 'tasks', 'registry'),
    };
  };

  // return plugin
  return plugin;
};
