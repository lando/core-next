'use strict';

const fs = require('fs');
const get = require('lodash/get');
const groupBy = require('lodash/groupBy');
const path = require('path');
const slugify = require('slugify');
const yaml = require('yaml');

const parsePkgName = require('../utils/parse-package-name');

const Config = require('./config');
const FileStorage = require('../components/file-storage');
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
  static debug = require('./debug')('@lando/core:minapp');

  // an internal and protected caching mechanism
  #_landoCache
  #_cache;

  #_init() {
    this.plugins = this.getPlugins();
    this.registry = this.getRegistry();
    this.hooks = this.getHooks();
  }

  // an internal way to "reinit" the bootstrap eg remove caches and repopulate them
  // @NOTE: should this be internal?
  #_reint() {
    this.#clearInternalCache(['disabled', 'invalid-plugins', 'plugins', 'registry']);
    this.#_init();
  }

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
  constructor({
    landofile,
    config,
    id,
    productCacheDir,
    product,
    debug = MinApp.debug,
  } = {}) {
    // @TODO: throw error if no landofile or doesnt exist
    // @TODO: if no name then we should throw an error
    // @TODO: throw error if config is not a Config object?

    // "private" but still "by convention" protected properties
    this._componentsCache = {};
    this._landofile = landofile;

    // start by loading in the main landofile
    const mainfile = yaml.parse(fs.readFileSync(landofile, 'utf8'));
    // save the original landofile parameter
    // compute some things we need with the mainfile
    this.name = slugify(mainfile.name, {lower: true, strict: true});
    this.root = path.dirname(landofile);
    this.sluggypath = slugify(this.root, {lower: true, strict: true});
    // and its downstreams
    this.debug = debug.extend(this.name);
    this.repoDir = path.join(this.root, '.lando');
    this.pluginsDir = path.join(this.repoDir, 'plugins');
    this.product = product || config.get('system.product') || 'lando';
    this.idPath = path.join(this.repoDir, 'id');

    // build the app config
    const {landofiles} = config.get('core');
    this.landofileExt = landofile.split('.').pop();
    this.landofile = path.basename(landofile, `.${this.landofileExt}`);
    // @NOTE: landofiles can only be overridden in the main landofile for, we hope, obvious reasons
    this.landofiles = this.getLandofiles(get(mainfile, 'config.core.landofiles', landofiles));
    // build the app config by loading in the apps
    // @NOTE: appConfig merging is currently a breaking change with V3 as it REPLACES arrays
    // instead of combining them. this is "better" behavior and what we want for V4 but maybe we should
    // do something to help make this "less" breaking?
    this.appConfig = new Config({
      // @TODO: below is a chicken-n-egg problem, can we find a place to put the cached landofiles that doesnt rely on cacheDir?
      // cached: path.join(this.cacheDir, 'landofiles.json'),
      managed: 'main',
      env: this.env,
      id: this.name,
      sources: Object.fromEntries(this.landofiles.map(landofile => ([landofile.type, landofile.path]))),
    });

    // configure/namespace some libs
    // @TODO: some sort of library mix in to override things?
    Config.debug = this.debug.extend('config');
    Config.id = this.name;
    this.Config = Config;
    Plugin.debug = this.debug.extend('plugin');
    Plugin.id = this.name;
    this.Plugin = Plugin;

    // try to find the app id
    // prioritize something passed in @NOTE: should we?
    this.id = id;
    // if we dont have an id yet then use appConfig.get('id)
    if (!this.id) {
      this.debug('trying to get id for app %o from landofiles', this.name);
      this.id = this.appConfig.get('id');
    }
    // if we still dont have one try to get from id path
    if (!this.id && fs.existsSync(this.idPath)) {
      this.debug('trying to get id for app %o from %o', this.name, this.idPath);
      try {
        this.id = fs.readFileSync(this.idPath, 'utf8');
      } catch {
        this.debug('could not get id from %o', this.idPath);
      }
    }
    // OMG if we dont have an id at this point then i guess like we should generate one?
    if (!this.id) {
      this.id = require('../utils/generate-id')();
      this.debug('generated id %o for app %o', this.id, this.name);

      // @TODO: how should we actually persist the id?
      // should we just write to the landofile? that already exists and would be easier than handling
      // creation of `.lando/id` and asking user to gitignore or not?
      //
      // but i guess for now: write to this.idPath
      fs.mkdirSync(path.dirname(this.idPath), {recursive: true});
      fs.writeFileSync(this.idPath, this.id);
    }

    // @TODO: is it possible to not have an ID at this point? should we error?

    // get needed props from the system config for other
    const {cacheDir, configDir, dataDir, instance} = config.get('system');

    // set other props that are name-dependent
    // @TODO: should we put more dirz into repoDir?
    this.cacheDir = path.join(cacheDir, 'apps', this.id);
    this.configDir = path.join(configDir, 'apps', this.id);
    this.dataDir = path.join(dataDir, 'apps', this.id);
    this.logsDir = path.join(this.dataDir, 'logs');
    this.env = `${this.product}-${this.name}`.toUpperCase().replace(/-/gi, '_');
    this.instance = instance;

    // created needed dirs
    for (const dir of [this.cacheDir, this.configDir, this.dataDir, this.logsDir]) {
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
      pluginsDir: this.pluginsDir,
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
    this.#_cache = new FileStorage(({debug: this.debug.extend('#appcache'), dir: this.cacheDir}));
    // get access to, presumably, the lando cache
    this.#_landoCache = new FileStorage(({debug: this.debug.extend('#cache'), dir: productCacheDir || config.get('system.cache-dir')}));

    // if no-cache is set then lets force a cache wipe
    // @TODO: should we nuke the whole cache or just the registry? right now its just the registry?
    if (!this.config.get('core.caching')) this.#_reint();

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
    const registry = Config.wrap(this.getRegistry(), {id: `${this.name}-class-cache`, env: false});
    // get the class
    return require('../utils/get-component')(component, config, registry, {cache, defaults});
  }

  // helper to get a component (and config?) from the registry
  async getComponentInstance(component, constructor = {}, config = this.config, opts = {}) {
    // configigy the registry
    const registry = Config.wrap(this.getRegistry(), {id: `${this.name}-class-cache`, env: false});
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
    if (this.#_cache.get('hooks')) {
      const hooks = this.#_cache.get('hooks');
      this.debug('grabbed %o hooks(s) from hooks cache', hooks.length);
      return hooks;
    }

    // if we get here then we need to do task discovery
    this.debug('running %o hooks discovery...', this.name);

    // get the hooks
    // NOTE: is this the right logic? both or prefer one over the other?
    const hooks = [
      require('../utils/get-manifest-array')('hooks', this).map(group => ({...group, hooks: group.data[this.name]})),
      require('../utils/get-manifest-array')('hooks', this).map(group => ({...group, hooks: group.data.app})),
    ].flat();

    // set, debug and return
    this.#_cache.set('hooks', hooks);
    this.debug('added %o hook group(s) to the hooks cache', hooks.length);
    return hooks;
  }

  getLandofiles(files = []) {
    return files
    // assemble the filename/type
    .map(type => ({
      filename: type === '' ? `${this.landofile}.${this.landofileExt}` : `${this.landofile}.${type}.${this.landofileExt}`,
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
    return this.plugins[data.name];
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
    if (this.appConfig.getUncoded('pluginDirs') && this.appConfig.getUncoded('pluginDirs').length > 0) {
      for (const [index, pluginDir] of this.appConfig.getUncoded('pluginDirs').entries()) {
        appPluginDirs[`app_plugin_dir_${index}`] = {
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
    if (this.appConfig.getUncoded('plugins') && Object.keys(this.appConfig.getUncoded('plugins').length > 0)) {
      const appStore = sources.find(source => source.store === 'app');
      appStore.plugins = Object.entries(this.appConfig.getUncoded('plugins'))
        .filter(plugin => fs.existsSync(path.join(this.root, plugin[1])))
        .map(plugin => new this.Plugin(path.join(this.root, plugin[1]), {type: 'app', ...options}));
    }

    // if we have "global" (we should btw) lando plugins then lets put those at the end so the serve as "defaults"
    if (this.#_landoCache.get('plugins')) {
      sources.push({
        store: 'global',
        plugins: Object.entries(this.#_landoCache.get('plugins')).map(([name, value]) => value),
      });
    }

    // do the discovery
    const {disabled, plugins, invalids} = require('../utils/get-plugins')(
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
    this.#_cache.set('disabled-plugins', disabled);
    this.#_cache.set('plugins', plugins);
    this.#_cache.set('invalid-plugins', invalids);
    // return
    return plugins;
  }

  getRegistry() {
    // if we have something cached then just return that
    if (this.#_cache.get('registry')) {
      const registry = this.#_cache.get('registry');
      this.debug('grabbed %o %o component(s) from cache', this.Config.keys(registry).length, this.name);
      return registry;
    }

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

module.exports = MinApp;
