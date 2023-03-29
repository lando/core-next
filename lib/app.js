'use strict';

const fs = require('fs');
const path = require('path');

const gos = require('../utils/get-object-sizes');
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
    this.manifest = this.getManifest();
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
    // core props
    this.name = name;
    this.id = id;
    this.appConfig = appConfig;
    // @TODO: should we allow defaults to be set for the below somehow? are they passed in? are they in config
    // somewhere? both?
    this.hooks = {};
    this.manifest = {};
    this.plugins = {};

    // pseudo protected props
    this._componentsCache = {};
    // global plugins
    this._plugins = plugins;

    // other stuff
    // @TODO: do we need env
    this.env = `${this.product}-${this.name}`.toUpperCase().replace(/-/gi, '_');
    this.debug = debug.extend(this.name);
    this.product = product || config.get('system.product') || 'lando';

    // configure/namespace some libs
    for (const Library of [Config, Plugin]) {
      Object.assign(Library, {id: this.name, debug: this.debug.extend(Library.name.toLowerCase())});
      this[Library.name] = Library;
    }

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
      'name': this.name,
      'cache-dir': this.cacheDir,
      'config-dir': this.configDir,
      'data-dir': this.dataDir,
      'logs-dir': this.logsDir,
      'plugins-dir': [...appConfig.get('plugin-dirs'), this.pluginsDir].filter(Boolean),
    };
    this.config = new Config({id: this.name, cached: path.join(this.cacheDir, 'config.json')});
    this.config.add('app', {type: 'literal', store: {app: appStuff, ...this.appConfig.getUncoded('config')}});
    this.config.add(this.product, {type: 'literal', store: config.getUncoded()});
    // dump the cache
    this.config.dump();

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
    const hooks = this.Config.merge(this.hooks,
      [
        this.manifest.getUncoded('hooks.product', {ams: 'aoa'}),
        this.manifest.getUncoded(`hooks.${this.name}`, {ams: 'aoa'}),
      ],
      ['aoa'],
    );

    // debug
    this.debug('found %o and %o hooks %o', this.name, 'app', gos(this.hooks));
    // return
    return hooks;
  }

  getManifest() {
    // if we have something cached then revive the manifest config
    if (this.#_cache.has('manifest')) return new Config(this.#_cache.get('manifest'));
    // if we get here then we need to build the manifest
    this.debug('running %o manifest construction...', this.id);

    // build the manifest from our plugins
    const manifest = new Config({id: 'manifest'});
    // loop through plugins in reverse order and add them to the manifest config
    for (const [name, plugin] of Object.entries(this.plugins).reverse()) {
      // clone the manifest
      // @TODO: something better here?
      const store = JSON.parse(JSON.stringify(plugin.manifest));
      // remove plugin specific things
      delete store.name;
      delete store.description;
      delete store.enabled;
      delete store.hidden;
      manifest.add(name, {type: 'literal', store});
    }

    // set
    this.#_cache.set('manifest', manifest);
    // return
    return manifest;
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

    // do the discovery
    const {disabled, enabled, invalids} = require('../utils/get-plugins')(
      [
        // these are plugins translated into single dir depth 0 searches
        ...Object.entries(this.appConfig.get('plugins'))
          .map(([name, dir]) => ({dir, depth: 0}))
          .filter(plugin => fs.existsSync(plugin.dir)),
        // these are just the plugin dirs to search
        ...this.appConfig.get('plugin-dirs'),
      ],
      {
        channel: this.config.get('core.release-channel'),
        config: this.config.get(),
        loadOpts: [this],
        type: 'app',
        ...options,
      },
      {Plugin: this.Plugin, debug: this.debug.extend('get-plugins')},
    );

    // rebase on any passed in plugins
    const plugins = {...this._plugins, ...enabled};

    // set things
    this.#_cache.set('plugins.disabled', disabled);
    this.#_cache.set('plugins.enabled', plugins);
    this.#_cache.set('plugins.invalid', invalids);

    // return
    return plugins;
  }

  getRegistry() {
    return this.manifest.get('registry', {decode: false, encode: false});
  }

  // public wrapper for reint
  reinit() {
    this.#_reint();
  }

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
  }
}

module.exports = App;
