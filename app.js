'use strict';

// Modules
const _ = require('lodash');
const warnings = require('./lib/warnings');

// Helper to set the LANDO_LOAD_KEYS var
const getKeys = (keys = true) => {
  if (_.isArray(keys)) return keys.join(' ');
  return keys.toString();
};

// Update built against
const updateBuiltAgainst = (app, version = 'unknown') => {
  app.meta = _.merge({}, app.meta, {builtAgainst: version});
  return app.meta;
};

module.exports = (app, lando) => {
  // If the app already is installed but we can't determine the builtAgainst, then set it to something bogus
  app.events.on('pre-start', () => {
    if (!_.has(app.meta, 'builtAgainst')) {
      return lando.engine.list({project: app.project, all: true}).then(containers => {
        if (!_.isEmpty(containers)) {
          lando.cache.set(app.metaCache, updateBuiltAgainst(app), {persist: true});
        }
      });
    }
  });

  // If we don't have a builtAgainst already then we must be spinning up for the first time and its safe to set this
  app.events.on('post-start', () => {
    if (!_.has(app.meta, 'builtAgainst')) {
      lando.cache.set(app.metaCache, updateBuiltAgainst(app, app._config.version), {persist: true});
    }
    if (app.meta.builtAgainst !== app._config.version) {
      app.addWarning(warnings.rebuildWarning());
    }
  });

  // Check for docker compat warnings and surface them nicely as well
  app.events.on('post-start', () => {
    _.forEach(_(lando.versions).filter(version => version.dockerVersion).value(), thing => {
      if (!thing.satisfied) app.addWarning(warnings.unsupportedVersionWarning(thing));
    });
  });

  // Reset app info on a stop, this helps prevent wrong/duplicate information being reported on a restart
  app.events.on('post-stop', () => lando.utils.getInfoDefaults(app));

  // Otherwise set on rebuilds
  // NOTE: We set this pre-rebuild because post-rebuild runs after post-start because you would need to
  // do two rebuilds to remove the warning since appWarning is already set by the time we get here.
  // Running pre-rebuild ensures the warning goes away but concedes a possible warning tradeoff between
  // this and a build step failure
  app.events.on('pre-rebuild', () => {
    lando.cache.set(app.metaCache, updateBuiltAgainst(app, app._config.version), {persist: true});
  });

  // Remove meta cache on destroy
  app.events.on('post-destroy', () => {
    app.log.debug('removing metadata cache...');
    lando.cache.remove(app.metaCache);
  });

  // REturn defualts
  return {
    env: {
      LANDO_APP_PROJECT: app.project,
      LANDO_APP_NAME: app.name,
      LANDO_APP_ROOT: app.root,
      LANDO_APP_ROOT_BIND: app.root,
      LANDO_APP_COMMON_NAME: _.truncate(app.project, {length: 64}),
      LANDO_LOAD_KEYS: getKeys(_.get(app, 'config.keys')),
      BITNAMI_DEBUG: 'true',
    },
    labels: {
      'io.lando.src': app.configFiles.join(','),
      'io.lando.http-ports': '80,443',
    },
  };
};
