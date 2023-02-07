'use strict';

const fs = require('fs');
const groupBy = require('lodash/groupBy');
const path = require('path');

const Config = require('./config');
const FileStorage = require('../components/file-storage');
const NoStorage = require('../components/no-storage');
const Plugin = require('./plugin');

class Bootstrapper {
  static debug = require('./debug')('@lando/core:bootstrap');

  static findApp(files, startFrom) {
    return require('../utils/find-app')(files, startFrom);
  }

  static findPlugins(dir, depth = 1) {
    return require('../utils/find-plugins')(dir, depth);
  }

  static normalizePlugins(plugins, by = 'name') {
    return require('../utils/normalize-plugins')(plugins, by);
  }

  // an internal and protected caching mechanism
  #_cache;

  #_init() {
    this.plugins = this.getPlugins();
    this.registry = this.getRegistry();
    this.hooks = this.getHooks();
  }

  // an internal way to "reinit" the bootstrap eg remove caches and repopulate them
  // @NOTE: should this be internal?
  #_reint() {
    this.#_cache.flush();
    this.#_init();
  }

  constructor(config = {}) {
    // @TODO: throw error if config is not Config
    // "private" but still "by convention" protected properties
    this._componentsCache = {};

    // core stuff
    this.id = config.id || 'lando';
    this.debug = config.debug || Bootstrapper.debug;
    // remove incoming debugger so we can rely on defaults downstream
    delete config.debug;

    // configure/namespace some libs
    // @TODO: some sort of library mix in to override things?
    Config.debug = this.debug.extend('config');
    Config.id = this.id;
    this.Config = Config;
    Plugin.debug = this.debug.extend('plugin');
    Plugin.id = this.id;
    this.Plugin = Plugin;

    // add our defaults as a source
    config.sources = {defaults: path.join(__dirname, '..', 'config', 'defaults.js'), ...config.sources};
    // them assebmle the config global config
    this.config = new Config(config);

    // get the id
    if (!this.config.get(`${this.config.managed}:system.instance`)) {
      const data = {system: {instance: require('../utils/generate-id')()}};
      this.config.save(data);
      this.config.defaults(data);
      this.debug('could not locate instance id, setting to %o', this.config.get('system.instance'));
    }

    // #_cache is an internal and protected property that hardcodes use of the core file-storage component
    // we do this because we need a way a to cache things before plugins/the registry are compiled,
    // because we cannot use something like async getComponent inside the constructor and because we do not
    // want a full-blow async init() method we need to call EVERY time we new Bootstrap()
    const StorageBackend = this.config.get('core.caching') ? FileStorage : NoStorage;
    this.#_cache = new StorageBackend(({debug: this.debug.extend('#cache'), dir: this.config.get('system.syscache-dir')}));

    // if caching is disable and cache dir exists then flush
    if (!this.config.get('core.caching') && fs.existsSync(this.config.get('system.syscache-dir'))) {
      FileStorage.flush(this.config.get('system.syscache-dir'), this.debug.extend('#flush'));
    }

    // initialize
    this.#_init();
  }

  // @TODO: the point of this is to have a high level way to "fetch" a certain kind of plugin eg global and
  // have it return a fully armed and operational instantiated plugin eg has the installer
  // @TODO: plugin.global-install-dir is not a thing anymore?
  // @TODO: would be cool for different "types"
  async addPlugin(name, dest = this.config.get('plugin.global-install-dir')) {
    // attempt to add the plugin
    const plugin = await this.Plugin.fetch(name, dest, {
      channel: this.config.get('core.release-channel'),
      installer: await this.getComponentInstance('core.plugin-installer'),
      type: 'global',
    });

    // reinit
    this.#_reint();

    // return the plugin
    return plugin;
  }

  // setup tasks for oclif
  async bootstrap(config = {}) {
    // get an id
    config.id = this.config.get('core.id') || this.config.get('core.id') || config.bin || path.basename(process.argv[1]);

    // reconcile debug flag
    config.debug = this.config.get('core.debug') || config.debug || false;
    // enable debugging if the config is set
    // @NOTE: this is only for core.debug=true set via the configfile, the --debug turns debugging on before this
    // @TODO: right now you cannot pass in --debug = string and you should be able to
    if (config.debug) require('debug').enable(config.debug === true || config.debug === 1 ? '*' : config.debug);

    // @TODO: this has to be config.id because it will vary based on what is using the bootstrap eg lando/hyperdrive
    config[config.id] = this;
    // Also just add a generic/reliable key someone can use to get whatever the product is
    config.product = this;
  }

  findApp(files, startFrom) {
    return require('../utils/find-app')(files, startFrom);
  }

  // @TODO: does it make sense to also make this an instance method?
  findPlugins(dir, depth = 1) {
    return require('../utils/find-plugins')(dir, depth);
  }

  normalizePlugins(plugins, by = 'name') {
    return require('../utils/normalize-plugins')(plugins, by);
  }

  // helper to get a class
  getComponent(component, {cache = this._componentsCache, defaults} = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.id}-class-cache`, env: false});
    // get the class
    return require('../utils/get-component')(component, this.config, registry, {cache, defaults, debug: this.debug.extend('get-component')});
  }

  // helper to get a component (and config?) from the registry
  async getComponentInstance(component, constructor = {}, opts = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.id}-class-cache`, env: false});
    // get the component
    return require('../utils/get-component-instance')(
      component,
      constructor,
      this.config,
      {cache: opts.cache, defaults: opts.defaults, init: opts.init, registry},
    );
  }

  getHooks() {
    // if we have something cached then just return that
    if (this.#_cache.has('hooks')) return this.#_cache.get('hooks');

    // if we get here then we need to do task discovery
    this.debug('running %o hooks discovery...', this.id);

    // get the hooks
    // NOTE: is this the right logic? both or prefer one over the other?
    const hooks = [
      require('../utils/get-manifest-array')('hooks', this).map(group => ({...group, hooks: group.data.product})),
      require('../utils/get-manifest-array')('hooks', this).map(group => ({...group, hooks: group.data[this.id]})),
    ].flat();

    // set
    this.#_cache.set('hooks', hooks);
    // return
    return hooks;
  }

  getPlugin(name) {
    // strip any additional metadata and return just the plugin name
    const data = require('../utils/parse-package-name')(name);
    // @TODO: do we want to throw an error if not found?
    return this.plugins[data.name];
  }

  // helper to return resolved and instantiated plugins eg this should be the list a given context needs
  // @TODO: we probably will also need a section for "team" plugins
  getPlugins(options = {}) {
    // if we have something cached then just return that
    if (this.#_cache.has('plugins.enabled')) return this.#_cache.get('plugins.enabled');

    // if we get here then we need to do plugin discovery
    this.debug('running %o plugin discovery...', this.id);

    // define "internals" so we can force it into the source list
    const internalPluginDirs = {
      internalCore: {
        type: 'core',
        dir: path.join(__dirname, '..'),
        depth: 0,
      },
      internalContrib: {
        type: 'core',
        dir: path.join(__dirname, '..', 'plugins'),
        depth: 2,
      },
      // internalExternal: {
      //   type: 'core',
      //   dir: path.join(__dirname, '..', 'node_modules', '@lando'),
      //   depth: 2,
      // },
    };
    const configPluginDirs = this.config.getUncoded('plugin.dirs');

    // munge all dirs together and translate into an object
    const dirs = Object.entries({...internalPluginDirs, ...configPluginDirs}).map(([name, value]) => ({...value, name}));
    // group into sources
    const sources = Object.entries(groupBy(dirs, 'type')).map(([store, dirs]) => ({store, dirs}));

    // do the discovery
    const {disabled, enabled, invalids} = require('../utils/get-plugins')(
      sources,
      {
        channel: this.config.get('core.release-channel'),
        config: this.config.get(),
        loadOpts: [this],
        type: 'global',
        ...options,
      },
      {Plugin: this.Plugin, debug: this.debug.extend('get-plugins')},
    );

    // set things
    this.#_cache.set('plugins.disabled', disabled);
    this.#_cache.set('plugins.enabled', enabled);
    this.#_cache.set('plugins.invalid', invalids);
    // return
    return enabled;
  }

  getRegistry() {
    // if we have something cached then just return that
    if (this.#_cache.has('registry')) return this.#_cache.get('registry');
    // if we get here then we need to do registry discovery
    this.debug('running %o registry discovery...', this.id);
    // build the registry with config and plugins
    const registry = require('../utils/get-manifest-object')('registry', this);
    // set
    this.#_cache.set('registry', registry);
    // return
    return registry;
  }

  reinit() {
    this.#_reint();
  };

  // helper to remove a plugin
  removePlugin(name) {
    // map plugin name to object
    const plugin = this.getPlugin(name);

    // throw error if there is no plugin to remove
    if (!plugin) throw new Error(`could not find a plugin called ${name}`);
    // throw error if plugin is a core plugin
    if (plugin.type === 'core') throw new Error(`${plugin.name} is a core plugin and cannot be removed`);

    // if we get here then remove the plugin
    plugin.remove();

    // reinit
    this.#_reint();

    // return the plugin
    return plugin;
  }

  async runHook(event, data) {
    return require('../utils/run-hook')(event, data, this.hooks, {[this.id]: this, product: this}, this.debug);
  };
}

module.exports = Bootstrapper;
