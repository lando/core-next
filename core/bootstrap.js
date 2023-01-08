const groupBy = require('lodash/groupBy');
const path = require('path');

const Config = require('./config');
const FileStorage = require('./../components/file-storage');
const Plugin = require('./plugin');

class Bootstrapper {
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

  // this is designed to specifically remove things from #_cache
  #clearInternalCache(keys) {
    // if cache is a string then make into an array
    if (typeof keys === 'string') keys = [keys];

    // loop through and remove caches
    for (const key of keys) {
      this.#_cache.remove(key);
    }

    // return keys that have been removed
    return keys ? keys : 'all';
  }

  constructor({
    config = {},
    noCache = false,
    registry = {},
  } = {}) {
    // the id
    this.id = config.id || 'lando';
    // add our defaults as a source
    config.sources = {defaults: path.join(__dirname, '..', 'config', 'defaults.js'), ...config.sources};
    // the global config
    this.config = new Config(config);
    // debugger
    this.debug = require('debug')(`${this.id}:@lando/core:${this.id}`);
    // a cache of loaded component classes
    this.registry = registry || {};

    // add some helpful things
    Config.id = this.id;
    Plugin.id = this.id;

    // add some helper classes
    this.Bootstrapper = Bootstrapper;
    this.Config = Config;
    this.Plugin = Plugin;

    // #_cache is an internal and protected property that hardcodes use of the core file-storage component
    // we do this because we need a way a to cache things before plugins/the registry are compiled,
    // because we cannot use something like async getComponent inside the constructor and because we do not
    // want a full-blow async init() method we need to call EVERY time we new Bootstrap()
    this.#_cache = new FileStorage(({debugspace: this.id, dir: this.config.get('system.cache-dir')}));

    // if no-cache is set then lets force a rebuild
    // @TODO: should we nuke the whole cache or just the registry?
    if (noCache) this.rebuildRegistry();

    // @TODO: should we do this every time?
    // @TODO: maybe a protected non-async #init or #setup?
    this.getPlugins();
    this.getRegistry(this.#_cache.get('plugins'));
  }

  // @TODO: the point of this is to have a high level way to "fetch" a certain kind of plugin eg global and
  // have it return a fully armed and operational instantiated plugin eg has the installer
  // @TODO: plugin.global-install-dir is not a thing anymore?
  // @TODO: would be cool for different "types"
  async addPlugin(name, dest = this.config.get('plugin.global-install-dir')) {
    // attempt to add the plugin
    const plugin = await this.Plugin.fetch(name, dest, {
      channel: this.config.get('core.release-channel'),
      installer: await this.getComponent('core.plugin-installer'),
      type: 'global',
    });

    // rebuild the registry
    this.rebuildRegistry();

    // return the plugin
    return plugin;
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
  getClass(component, {cache = this.registry, defaults} = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.id}-class-cache`, env: false});
    // get the class
    return require('../utils/get-class')(component, this.config, registry, {cache, defaults});
  }

  // helper to get a component (and config?) from the registry
  async getComponent(component, constructor = {}, opts = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.id}-class-cache`, env: false});
    // get the component
    return require('../utils/get-component')(
      component,
      constructor,
      this.config,
      {cache: opts.cache, defaults: opts.defaults, init: opts.init, registry},
    );
  }

  getPlugin(name) {
    // strip any additional metadata and return just the plugin name
    const data = require('../utils/parse-package-name')(name);
    // @TODO: do we want to throw an error if not found?
    return this.getPlugins()[data.name];
  }

  // helper to return resolved and instantiated plugins eg this should be the list a given context needs
  // @TODO: we probably will also need a section for "team" plugins
  getPlugins(options = {}) {
    // if we have something cached then just return that
    if (this.#_cache.get('plugins')) {
      const plugins = this.#_cache.get('plugins');
      this.debug('grabbed %o %o plugin(s) from cache', Object.keys(plugins).length, this.id);
      return plugins;
    }

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
    const {plugins, invalids} = require('../utils/get-plugins')(
      sources,
      this.Plugin,
      {channel: this.config.get('core.release-channel'), ...options, config: this.config.get(), type: 'global'},
    );

    // set things
    this.#_cache.set('plugins', plugins);
    this.#_cache.set('invalid-plugins', invalids);
    // return
    return plugins;
  }

  getRegistry(plugins = this.getPlugins()) {
    // if we have something cached then just return that
    if (this.#_cache.get('registry')) {
      const registry = this.#_cache.get('registry');
      this.debug('grabbed %o %o component(s) from cache', this.Config.keys(registry).length, this.id);
      return registry;
    }

    // if we get here then we need to do registry discovery
    this.debug('running %o registry discovery...', this.id);
    // build the registry with config and plugins
    const registry = require('../utils/get-registry')(this.config, plugins);

    // set
    this.#_cache.set('registry', registry);
    // return
    return registry;
  }

  // helper to rebuild the plugin an registry
  rebuildRegistry() {
    this.#clearInternalCache(['plugins', 'invalid-plugins', 'registry']);
    this.getPlugins();
    this.getRegistry();
  }

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

    // rebuld registry
    this.rebuildRegistry();

    // return the plugin
    return plugin;
  }

  // return some system status information
  status() {
    // each check should have a requirement and preferred?

    // packaged status

    // user information, not running as root?
    // userInfo?

    // os/platform information, release info?
    // os.release() os.version?

    // arch information

    // hardware information?
    // os.freemem os.totalmem

    console.log(this.config.get('system'));
  }

  // setup tasks for oclif
  async run(config = {}) {
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
  }
}

module.exports = Bootstrapper;
