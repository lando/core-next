'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

module.exports = async lando => {
  // load in legacy inits
  await require('./lando-load-legacy-inits')(lando);

  // build the cache: filter plugins with existing tasks dirs
  const pluginsWithTasks = lando.config.plugins.filter(plugin => fs.existsSync(plugin.tasks));

  // get all .js task files from each plugin's tasks directory
  const taskFiles = _.flatten(pluginsWithTasks.map(plugin =>
    _(fs.readdirSync(plugin.tasks))
      .map(file => path.join(plugin.tasks, file))
      .filter(filePath => _.endsWith(filePath, '.js'))
      .value(),
  ));

  // load each task file and register it
  for (const file of taskFiles) {
    lando.tasks.push({...require(file)(lando, {}), file});
    lando.log.debug('autoloaded global task %s', path.basename(file, '.js'));
  }

  // persist the task cache
  lando.cache.set('_.tasks.cache', JSON.stringify(lando.tasks), {persist: true});
};
