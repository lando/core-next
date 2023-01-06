const crypto = require('crypto');
const fs = require('fs');
const get = require('lodash/get');
const groupBy = require('lodash/groupBy');
const path = require('path');
const slugify = require('slugify');
const yaml = require('yaml');

const parsePkgName = require('../utils/parse-package-name');

const Config = require('./config');
const FileStorage = require('./../components/file-storage');
const Plugin = require('./plugin');

/**
 * @NOTE: the purpose of the minapp is something we can just new MinApp() without a helper async load/init function
 * it should quickly return and give us "all the things we need which is TBD" for hyperdrive that would be
 * just assembling the landofile config, plugins, etc, for lando that might also include being able to exec a command
 * @NOTE: does this min minapp lacks any ASYNC init like engine/plugin etc? what happens when the assembled config is not
 * complete eg has not gone through app init? maybe an init: false prop?
 *
 * @TODO: lots of the config loading makes sense in the constructor EXCEPT for selecting the relevant app component
 * to use, that needs to be done outside of this but how do we do that? probably in the load app util function?
 */
class MinApp {
  // an internal and protected caching mechanism
  #_landoCache
  #_cache;

  // landofilestuff
  #landofile
  #landofiles
  #landofileExt

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

  /**
   * @TODO: options? channel?
   */
  constructor({landofile, config} = {}) {
    // @TODO: throw error if no landofile or doesnt exist
    // @TODO: if no name then we should throw an error
    // start by loading in the main landofile and getting the name
    const mainfile = yaml.parse(fs.readFileSync(landofile, 'utf8'));
    this.name = slugify(mainfile.name, {lower: true, strict: true});
    this.root = path.dirname(landofile);
    Config.id = this.name;
    Plugin.id = this.name;
    this.Config = Config;
    this.Plugin = Plugin;

    // get needed props from the system config
    const {cacheDir, configDir, dataDir, instance, product} = config.get('system');
    const {landofiles} = config.get('core');

    // set other props that are name-dependent
    this.cacheDir = path.join(cacheDir, 'apps', this.name);
    this.configDir = path.join(configDir, 'apps', this.name);
    this.dataDir = path.join(dataDir, 'apps', this.name);
    this.logsDir = path.join(this.dataDir, 'logs');
    this.pluginsDir = path.join(this.root, '.lando', 'plugins');
    this.debug = require('debug')(`${this.name}:@lando/core:minapp`);
    this.env = `${product}-${this.name}`.toUpperCase().replace(/-/gi, '_');
    this.id = slugify(crypto.createHash('sha1').update(`${landofile}:${this.name}`).digest('base64'));
    this.instance = instance;
    this.registry = [];

    // private props
    this.#landofileExt = landofile.split('.').pop();
    this.#landofile = path.basename(landofile, `.${this.#landofileExt}`);
    // @NOTE: landofiles can only be overridden in the main landofile for, i hope, obvious reasons
    this.#landofiles = this.getLandofiles(get(mainfile, 'config.core.landofiles', landofiles));

    // created needed dirs
    for (const dir of [this.cacheDir, this.configDir, this.dataDir, this.logsDir]) {
      fs.mkdirSync(path.dirname(dir), {recursive: true});
      this.debug('ensured directory %o exists', dir);
    }

    // build the app config by loading in the apps
    // @NOTE: appConfig merging is currently a breaking change with V3 as it REPLACES arrays
    // instead of combining them. this is "better" behavior and what we want for V4 but maybe we should
    // do something to help make this "less" breaking?
    this.appConfig = new Config({
      cached: path.join(this.cacheDir, 'landofiles.json'),
      managed: 'main',
      env: this.env,
      id: this.name,
      sources: Object.fromEntries(this.#landofiles.map(landofile => ([landofile.type, landofile.path]))),
    });

    // separate out the config and mix in the global ones
    // @NOTE: im guessing "other" things like composeCache, etc will be dumped via the cache?
    const appStuff = {
      name: this.name,
      location: this.root,
      cacheDir: this.cacheDir,
      configDir: this.configDir,
      dataDir: this.dataDir,
      logsDir: this.logsDir,
      pluginsDir: this.pluginsDir,
    };
    this.config = new Config({id: this.name, cached: path.join(appStuff.cacheDir, 'config.json')});
    this.config.add('app', {type: 'literal', store: {app: appStuff, ...this.appConfig.getUncoded('config')}});
    this.config.add(product, {type: 'literal', store: config.getUncoded()});
    // dump the cache
    this.config.dumpCache();

    // #_cache is an internal and protected property that hardcodes use of the core file-storage component
    // we do this because we need a way a to cache things before plugins/the registry are compiled,
    // because we cannot use something like async getComponent inside the constructor and because we do not
    // want a full-blow async init() method we need to call EVERY time we new Bootstrap()
    this.#_cache = new FileStorage(({debugspace: this.name, dir: this.cacheDir}));
    // similar to above but for lando itself, we do this so we have access to "global" plugins and registry
    this.#_landoCache = new FileStorage(({debugspace: this.product, dir: this.config.get('system.cache-dir')}));

    // load plugins and registry stuff
    // @TODO: should we do this every time?
    // @TODO: maybe a protected non-async #init or #setup?
    this.getPlugins();
    this.getRegistry(this.#_cache.get('plugins'));
  }

  // @TODO: the point of this is to have a high level way to "fetch" a certain kind of plugin eg global and
  // have it return a fully armed and operational instantiated plugin eg has the installer
  async addPlugin(name, dest = this.pluginsDir) {
    // attempt to add the plugin
    const plugin = await this.Plugin.fetch(name, dest, {
      channel: this.config.get('core.release-channel'),
      installer: await this.getComponent('core.plugin-installer'),
      type: 'app',
    });

    // try to figure out the source to drop into the landofile
    const request = parsePkgName(name);
    const source = request.peg ? request.peg : `^${plugin.version}`;
    // modify the landofile with the updated plugin
    this.appConfig.save({plugins: {[plugin.name]: source}});

    // rebuild the registry
    this.rebuildRegistry();

    // return the plugin
    return plugin;
  }

  // helper to get a class
  getClass(component, {cache = true, defaults} = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.name}-class-cache`, env: false});
    // get the class
    return require('../utils/get-class')(component, this.config, registry, {cache, defaults});
  }

  // helper to get a component (and config?) from the registry
  async getComponent(component, constructor = {}, opts = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.name}-class-cache`, env: false});
    // get the component
    return require('../utils/get-component')(
      component,
      constructor,
      this.config,
      {cache: opts.cache, defaults: opts.defaults, init: opts.init, registry},
    );
  }

  getLandofiles(files = []) {
    return files
    // assemble the filename/type
    .map(type => ({
      filename: type === '' ? `${this.#landofile}.${this.#landofileExt}` : `${this.#landofile}.${type}.${this.#landofileExt}`,
      type: type === '' ? 'main' : type,
    }))
    // get the absolute paths
    .map(landofile => ({type: landofile.type, path: path.join(this.root, landofile.filename)}))
    // filter out ones that dont exist
    .filter(landofile => fs.existsSync(landofile.path))
    // merge in includes
    .map(landofile => {
      // see if we have any includes
      const includes = get(yaml.parse(fs.readFileSync(landofile.path, 'utf8')), 'includes');
      if (includes) {
        const landofiles = this.getLandofiles((typeof includes === 'string') ? [includes] : includes);
        return [...landofiles, landofile];
      }

      // otherwise arrify and return
      return [landofile];
    })
    // flatten
    .flat(Number.POSITIVE_INFINITY);
  }

  getPlugin(name) {
    // strip any additional metadata and return just the plugin name
    const data = parsePkgName(name);
    // @TODO: do we want to throw an error if not found?
    return this.getPlugins()[data.name];
  }

  // @TODO: we probably will also need dirs for core plugins for lando
  // @TODO: we probably will also need a section for "team" plugins
  getPlugins(options = {}) {
    // if we have something cached then just return that
    if (this.#_cache.get('plugins')) {
      const plugins = this.#_cache.get('plugins');
      this.debug('grabbed %o %o plugin(s) from cache', Object.keys(plugins).length, this.name);
      return plugins;
    }

    // if we get here then we need to do plugin discovery
    this.debug('running %o plugin discovery...', this.name);

    // start to build out our sources
    // @TODO: we need to make sure we can directly pass in plugins
    // define "internals" so we can force it into the source list
    const appPluginDirs = {app: {type: 'app', dir: this.pluginsDir, depth: 2}};

    // if we have additional pluginDirs then lets add them
    if (this.appConfig.getUncoded('pluginDirs').length > 0) {
      for (const pluginDir of this.appConfig.getUncoded('pluginDirs')) {
        appPluginDirs[`app_${pluginDir}`] = {
          type: 'app',
          dir: path.resolve(this.root, pluginDir),
          depth: 2,
        };
      };
    }

    // munge all dirs together and translate into an object
    const dirs = Object.entries({...appPluginDirs}).map(([name, value]) => ({...value, name}));
    // group into sources
    const sources = Object.entries(groupBy(dirs, 'type')).map(([store, dirs]) => ({store, dirs}));

    // if we have "local" plugins then lets put those in the front
    if (Object.keys(this.appConfig.getUncoded('plugins').length > 0)) {
      const appStore = sources.find(source => source.store === 'app');
      appStore.plugins = Object.entries(this.appConfig.getUncoded('plugins'))
        .filter(plugin => fs.existsSync(path.join(this.root, plugin[1])))
        .map(plugin => new this.Plugin(path.join(this.root, plugin[1]), {type: 'app', ...options}));
    }

    // if we have "global" (we should btw) lando plugins then lets put those in the front
    if (this.#_landoCache.get('plugins')) {
      sources.unshift({
        store: 'global',
        plugins: Object.entries(this.#_landoCache.get('plugins')).map(([name, value]) => value),
      });
    }

    // do the discovery
    const {plugins, invalids} = require('../utils/get-plugins')(
      sources,
      this.Plugin,
      {channel: this.config.get('core.release-channel'), ...options, config: this.config.get(), type: 'app'},
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
      this.debug('grabbed %o %o component(s) from cache', this.Config.keys(registry).length, this.name);
      return registry;
    }

    // if we get here then we need to do registry discovery
    this.debug('running %o registry discovery...', this.name);

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
    if (plugin.type !== 'app') throw new Error(`${plugin.name} is a ${plugin.type} plugin and cannot be removed from here`);
    // throw error if this is a local app plugin
    if (plugin.location !== path.join(this.pluginsDir, plugin.name)) {
      throw new Error('cannot remove local app plugins, please remove manually');
    }

    // if we get here then remove the plugin
    plugin.remove();

    // rebuld registry
    this.rebuildRegistry();

    // return the plugin
    return plugin;
  }
}

module.exports = MinApp;
