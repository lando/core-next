const fs = require('fs');
const path = require('path');
const groupBy = require('lodash/groupBy');
const Config = require('./config');
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

  #invalidPlugins;
  #plugins;
  #registry;
  #tasks;

  constructor(options = {}) {
    // the id
    this.id = options.id || 'lando';
    // the global config
    this.config = new Config(options);
    // debugger
    this.debug = require('debug')(`${this.id}:@lando/core:${this.id}`);
    // just save the options
    this.options = options;
    // a cache of loaded component classes
    this.registry = options.registry || {};

    // add some helpful things
    Config.id = this.id;
    Plugin.id = this.id;

    // add some helper classes
    this.Bootstrapper = Bootstrapper;
    this.Config = Config;
    this.Plugin = Plugin;

    // some "important" caches
    this.pluginsCache = path.join(this.config.get('system.cache-dir'), 'plugins.json');
    this.registryCache = path.join(this.config.get('system.cache-dir'), 'registry.json');

    // @TODO: eventually optimize the below, init method?
    this.#plugins = this.getPlugins();
    this.#registry = this.getRegistry(this.#plugins);
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
    // reset the plugin cache
    this.#plugins = undefined;
    this.#invalidPlugins = undefined;
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
    const registry = new Config({env: false});
    registry.add('all', {type: 'literal', store: this.getRegistry()});
    // get the class
    return require('../utils/get-class')(component, this.config, registry, {cache, defaults});
  }

  // helper to get a component (and config?) from the registry
  async getComponent(component, constructor = {}, opts = {}) {
    // configigy the registry
    const registry = new Config({env: false});
    registry.add('all', {type: 'literal', store: this.getRegistry()});
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
    // if no plugins but a cache then set plugins
    if (!this.#plugins && fs.existsSync(this.pluginsCache)) this.#plugins = require(this.pluginsCache);
    // if we've already done this then return the result
    if (this.#plugins) {
      this.debug('grabbed %o %o plugins from cache', Object.keys(this.#plugins).length, this.id);
      return this.#plugins;
    }

    // if we get here then we need to do plugin discovery
    this.debug('running %o plugin discovery...', this.id);

    // define "internals" so we can force it into the source list
    const internalPluginDir = {
      type: 'core',
      dir: path.join(__dirname, '..', 'plugins'),
      depth: 2,
    };
    const configPluginDirs = this.config.getUncoded('plugin.dirs');

    // munge all dirs together and translate into an object
    const dirs = Object.entries({internal: internalPluginDir, ...configPluginDirs}).map(([name, value]) => ({...value, name}));
    // group into sources
    const sources = Object.entries(groupBy(dirs, 'type')).map(([store, dirs]) => ({store, dirs}));

    // do the discovery
    const {plugins, invalids} = require('../utils/get-plugins')(
      sources,
      this.Plugin,
      {channel: this.config.get('core.release-channel'), ...options, config: this.config.get(), type: 'global'},
    );

    // set things
    this.#plugins = plugins;
    this.#invalidPlugins = invalids;
    // dump
    const pluginCache = Config.wrap(this.#plugins, {env: false, cached: this.pluginsCache});
    pluginCache.dumpCache();
    // return
    return this.#plugins;
  }

  getRegistry(plugins = this.getPlugins()) {
    // if no plugins but a cache then set plugins
    if (!this.#registry && fs.existsSync(this.registryCache)) this.#registry = require(this.registryCache);
    // if we've already done this then return the result
    if (this.#registry) {
      this.debug('grabbed %o %o components from cache', this.Config.keys(this.#registry).length, this.id);
      return this.#registry;
    }

    // if we get here then we need to do registry discovery
    this.debug('running %o registry discovery...', this.id);
    // spin up a config instance to help us merge it all together
    const registry = new Config({env: false, cached: path.join(this.config.get('system.cache-dir'), 'registry.json')});

    // start by going through the config and adding in each store as we normalize plugins, the order here is important
    for (const [name, store] of Object.entries(this.config.stores)) {
      // if a file store then we need to normalize the registry
      if (store.type === 'file') {
        registry.add(name, {
          type: 'literal',
          store: require('../utils/normalize-registry-paths')(store.get('registry'), path.dirname(store.file)),
        });
      // otherwise just add it as is
      } else if (store.type !== 'env') {
        registry.add(name, {type: 'literal', store: store.get('registry')});
      }
    }

    // then go through all the plugins and do the same, the order here is not important
    for (const [name, plugin] of Object.entries(plugins)) {
      registry.add(name, {
        type: 'literal',
        store: require('../utils/normalize-registry-paths')(plugin.manifest.registry, plugin.location),
      });
    }

    // @TODO: merge in any "default" components
    // @NOTE: maybe when we make @lando/core-next also a plugin that gets loaded first we dont need ^

    // dump
    registry.dumpCache();
    // set
    this.#registry = registry.getUncoded();
    // return
    return this.#registry;
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
    // reset cache
    this.#plugins = undefined;
    this.#invalidPlugins = undefined;
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
