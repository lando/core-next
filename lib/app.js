'use strict';

const fs = require('fs');
const groupBy = require('lodash/groupBy');
const path = require('path');

const parsePkgName = require('../utils/parse-package-name');

const Config = require('./config');
const FileStorage = require('../components/file-storage');
const NoStorage = require('../components/no-storage');
const Plugin = require('./plugin');

/*
 * TBD
 */
class App {
  static debug = require('./debug')('@lando/core:app');

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

  /**
   * @TODO: options? channel?
   */
  constructor({
    name,
    appConfig,
    config,
    id,
    product,
    plugins = {},
    debug = App.debug,
  } = {}) {
    // @TODO: throw error if config/appConfig is not a Config object?
    // @TODO: throw error if no name/id/appConfig?

    // pseudo protected props
    this._componentsCache = {};
    this._plugins = plugins;

    // core props
    this.name = name;
    this.id = id;
    this.appConfig = appConfig;

    // other stuff
    this.env = `${this.product}-${this.name}`.toUpperCase().replace(/-/gi, '_');
    this.debug = debug.extend(this.name);
    this.product = product || config.get('system.product') || 'lando';

    // configure/namespace some libs
    for (const Library of [Config, Plugin]) {
      Object.assign(Library, {id: this.name, debug: this.debug.extend(Library.name.toLowerCase())});
      this[Library.name] = Library;
    };

    // get needed props from the system config for other
    const {cacheDir, configDir, dataDir, instance} = config.get('system');

    // set other props that are name-dependent
    this.cacheDir = path.resolve(cacheDir, '..', `${this.product}.${this.id}`);
    this.configDir = path.join(configDir, 'apps', this.id);
    this.dataDir = path.join(dataDir, 'apps', this.id);
    this.logsDir = path.join(this.dataDir, 'logs');
    this.pluginsDir = path.join(this.dataDir, 'plugins');
    this.syscacheDir = path.resolve(cacheDir, '..', `${this.product}.${this.id}.system`);
    this.instance = instance;

    // created needed dirs
    for (const dir of [this.cacheDir, this.configDir, this.dataDir, this.logsDir, this.syscacheDir]) {
      fs.mkdirSync(path.dirname(dir), {recursive: true});
      this.debug('ensured directory %o exists', dir);
    }

    // separate out the config and mix in the global ones
    // @NOTE: im guessing "other" things like composeCache, etc will be dumped via the cache?
    const appStuff = {
      name: this.name,
      location: this.root,
      cacheDir: this.cacheDir,
      configDir: this.configDir,
      dataDir: this.dataDir,
      logsDir: this.logsDir,
      pluginDirs: [...appConfig.get('plugin-dirs'), this.pluginsDir].filter(Boolean),
    };
    this.config = new Config({id: this.name, cached: path.join(appStuff.cacheDir, 'config.json')});
    this.config.add('app', {type: 'literal', store: {app: appStuff, ...this.appConfig.getUncoded('config')}});
    this.config.add(this.product, {type: 'literal', store: config.getUncoded()});
    // dump the cache
    this.config.dumpCache();

    // #_cache is an internal and protected property that hardcodes use of the core file-storage component
    // we do this because we need a way a to cache things before plugins/the registry are compiled,
    // because we cannot use something like async getComponent inside the constructor and because we do not
    // want a full-blow async init() method we need to call EVERY time we new Bootstrap()
    const StorageBackend = this.config.get('core.caching') ? FileStorage : NoStorage;
    this.#_cache = new StorageBackend(({debug: this.debug.extend('#appcache'), dir: this.syscacheDir}));

    // if no-cache is set then lets force a cache wipe
    // if caching is disable and cache dir exists then flush
    if (!this.config.get('core.caching') && fs.existsSync(this.syscacheDir)) {
      FileStorage.flush(this.syscacheDir, this.debug.extend('#flush'));
    }

    // init
    this.#_init();
  }

  // @TODO: the point of this is to have a high level way to "fetch" a certain kind of plugin eg global and
  // have it return a fully armed and operational instantiated plugin eg has the installer
  async addPlugin(name, dest = this.pluginsDir) {
    // attempt to add the plugin
    const plugin = await this.Plugin.fetch(name, dest, {
      channel: this.config.get('core.release-channel'),
      installer: await this.getComponentInstance('core.plugin-installer'),
      type: 'app',
    });

    // try to figure out the source to drop into the landofile
    const request = parsePkgName(name);
    const source = request.peg ? request.peg : `^${plugin.version}`;
    // modify the landofile with the updated plugin
    this.appConfig.save({plugins: {[plugin.name]: source}});

    // reinit
    this.#_reint();

    // return the plugin
    return plugin;
  }

  // helper to get a class
  getComponent(component, {cache = this._componentsCache, config = this.config, defaults} = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.name}.components`, env: false});
    // get the class
    return require('../utils/get-component')(component, config, registry, {cache, defaults});
  }

  // helper to get a component (and config?) from the registry
  async getComponentInstance(component, constructor = {}, config = this.config, opts = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.name}.components`, env: false});
    // get the component
    return require('../utils/get-component-instance')(
      component,
      constructor,
      config,
      {cache: opts.cache, defaults: opts.defaults, init: opts.init, registry},
    );
  }

  getHooks() {
    // if we have something cached then just return that
    if (this.#_cache.has('hooks')) return this.#_cache.get('hooks');

    // if we get here then we need to do task discovery
    this.debug('running %o hooks discovery...', this.name);

    // get the hooks
    // NOTE: is this the right logic? both or prefer one over the other?
    const hooks = [
      require('../utils/get-manifest-array')('hooks', this).map(group => ({...group, hooks: group.data[this.name]})),
      require('../utils/get-manifest-array')('hooks', this).map(group => ({...group, hooks: group.data.app})),
    ].flat();

    // set
    this.#_cache.set('hooks', hooks);
    // return
    return hooks;
  }

  getPlugin(name) {
    // strip any additional metadata and return just the plugin name
    const data = parsePkgName(name);
    // @TODO: do we want to throw an error if not found?
    return this.plugins[data.name];
  }

  // @TODO: we probably will also need dirs for core plugins for lando
  // @TODO: we probably will also need a section for "team" plugins
  getPlugins(options = {}) {
    // if we have something cached then just return that
    if (this.#_cache.has('plugins.enabled')) return this.#_cache.get('plugins.enabled');

    // if we get here then we need to do plugin discovery
    this.debug('running %o plugin discovery...', this.name);

    // start to build out our sources
    // @TODO: we need to make sure we can directly pass in plugins
    // define "internals" so we can force it into the source list
    const appPluginDirs = Object.fromEntries(this.config.get('app.pluginDirs')
      .map((pluginDir, index) => ({type: 'app', dir: pluginDir, depth: 2, name: `app_plugin_dir_${index}`}))
      .map(dir => ([dir.name, dir])));

    // munge all dirs together and translate into an object
    const dirs = Object.entries({...appPluginDirs}).map(([name, value]) => ({...value, name}));
    // group into sources
    const sources = Object.entries(groupBy(dirs, 'type')).map(([store, dirs]) => ({store, dirs}));

    // if we have "local" plugins then lets put those in the front
    if (this.appConfig.getUncoded('plugins') && Object.keys(this.appConfig.getUncoded('plugins').length > 0)) {
      const appStore = sources.find(source => source.store === 'app');
      for (const [name, data] of Object.entries(this.appConfig.getUncoded('plugins'))) {
        if (fs.existsSync(data)) {
          appStore.dirs.unshift({type: 'app', dir: data, depth: 0, name: `app_local_dir_${name}`});
        }
      };
    }

    // if we have "global" (we should btw) lando plugins then lets put those at the end so the serve as "defaults"
    if (Object.keys(this._plugins).length > 0) {
      sources.push({store: 'global', plugins: Object.entries(this._plugins).map(([name, value]) => value)});
    }

    // do the discovery
    const {disabled, enabled, invalids} = require('../utils/get-plugins')(
      sources,
      {
        channel: this.config.get('core.release-channel'),
        config: this.config.get(),
        loadOpts: [this],
        type: 'app',
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
    this.debug('running %o registry discovery...', this.name);
    // build the registry with config and plugins
    const registry = require('../utils/get-manifest-object')('registry', this);
    // set
    this.#_cache.set('registry', registry);
    // return
    return registry;
  }

  // public wrapper for reint
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
    if (plugin.type !== 'app') throw new Error(`${plugin.name} is a ${plugin.type} plugin and cannot be removed from here`);
    // throw error if this is a local app plugin
    if (plugin.location !== path.join(this.pluginsDir, plugin.name)) {
      throw new Error('cannot remove local app plugins, please remove manually');
    }

    // if we get here then remove the plugin
    plugin.remove();

    // reinit
    this.#_reint();

    // return the plugin
    return plugin;
  }

  async runHook(event, data) {
    return require('../utils/run-hook')(event, data, this.hooks, {app: this}, this.debug);
  };
}

module.exports = App;
