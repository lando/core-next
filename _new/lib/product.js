import fs from 'node:fs';

class Product {
  static debug = require('./debug')('@lando/core:product');

  static findApp(files, startFrom) {
    return require('../utils/find-app')(files, startFrom);
  }

  // an internal and protected caching mechanism
  #_cache;

  #_init() {
    this.plugins = this.getPlugins();
    this.manifest = this.getManifest();
    this.hooks = this.getHooks();
  }

  // an internal way to "reinit" the bootstrap eg remove caches and repopulate thema
  // @NOTE: should this be internal?
  #_reint() {
    this.#_cache.flush();
    this.#_init();
  }

  constructor(config, { debug = Product.debug, StorageBackend = require('../components/file-storage') } = {}) {
    // @TODO: throw error if not a config class?
    // @TODO: options for config?
    this.config = config || new require('./config')(); // eslint-disable-line new-cap
    // reset the config debugger
    this.config.constructor.debug = this.config.debug;

    // @TODO: should we allow defaults to be set for the below somehow? are they passed in? are they in config
    // somewhere? both?
    this.hooks = {};
    this.manifest = {};
    this.plugins = {};

    // core stuff
    this.id = config.id || 'lando';
    this.debug = debug;

    // add our defaults as a source
    this.config.defaults('product-defaults', require('../workspace/product-defaults')({ id: this.id, env: this.id }));

    // get the id
    if (!this.config.get(`${this.config.managed}:system.instance`)) {
      const data = { system: { instance: require('../utils/generate-id')() } };
      this.config.save(data);
      this.config.set('system.instance', data.system.instance);
      this.debug('could not locate instance id, setting to %o', this.config.get('system.instance'));
    }

    // #_cache is an internal and protected property that hardcodes use of the core file-storage component
    // we do this because we need a way a to cache things before plugins/the registry are compiled,
    // because we cannot use something like async getComponent inside the constructor and because we do not
    // want a full-blow async init() method we need to call EVERY time we new Bootstrap()
    this.#_cache = new StorageBackend({
      debug: this.debug.extend('#cache'),
      dir: this.config.get('system.syscache-dir'),
    });

    // if caching is disable and cache dir exists then flush
    if (!this.config.get('core.caching') && fs.existsSync(this.config.get('system.syscache-dir'))) {
      StorageBackend.flush(this.config.get('system.syscache-dir'), this.debug.extend('#flush'));
    }

    // initialize
    this.#_init();

    // "private" but still "by convention" protected properties
    this._componentsCache = {};
    this._componentAlises = Object.fromEntries(
      Object.entries(this.config.getUncoded('core'))
        .filter(([, component]) => typeof component === 'string')
        .map(([type, component]) => [`core.${type}`, `${type}.${component}`]),
    );
  }

  // @TODO: the point of this is to have a high level way to "fetch" a certain kind of plugin eg global and
  // have it return a fully armed and operational instantiated plugin eg has the installer
  // @TODO: plugin.global-install-dir is not a thing anymore?
  // @TODO: would be cool for different "types"
  async addPlugin(name, dest = this.config.get('plugin.global-install-dir')) {
    // attempt to add the plugin
    const plugin = await this.Plugin.fetch(name, dest, {
      installer: await this.getComponentInstance('core.plugin-installer'),
      type: 'global',
    });

    // reinit
    this.#_reint();

    // return the plugin
    return plugin;
  }

  // what does this do? maybe just a hook?
  async bootstrap(data) {
    this.runHook('bootstrap', data);
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
  getComponent(component) {
    // @TODO: should we allow for a separate aliases section in the config?
    return require('../utils/get-component')(
      component,
      this.config.newConfig({ data: this.getRegistry(), id: `${this.id}-component-registry` }),
      {
        aliases: this._componentAlises,
        cache: this._componentsCache,
        config: this.config.get(),
        debug: this.debug.extend('get-component'),
      },
    );
  }

  // helper to get a component (and config?) from the registry
  async getComponentInstance(component, constructor = {}) {
    return require('../utils/get-component-instance')(component, constructor, {
      aliases: this._componentAlises,
      cache: this._componentsCache,
      config: this.config.get(),
      debug: this.debug.extend('get-component-instance'),
      registry: this.config.newConfig({ data: this.getRegistry(), id: `${this.id}-component-registry` }),
    });
  }

  getHooks() {
    const hooks = this.config.merge(
      this.hooks,
      [this.manifest.getUncoded('hooks.product', { ams: 'aoa' }), this.manifest.getUncoded(`hooks.${this.id}`, { ams: 'aoa' })],
      ['aoa'],
    );

    // debug
    this.debug('found %o and %o hooks %o', this.id, 'product', require('../utils/get-object-sizes')(this.hooks));
    // return
    return hooks;
  }

  getManifest() {
    // if we have something cached then revive the manifest config
    if (this.#_cache.has('manifest')) return this.config.newConfig(this.#_cache.get('manifest'));
    // if we get here then we need to build the manifest
    this.debug('building %o manifest...', this.id);

    // build the manifest from our plugins
    const manifest = this.config.newConfig({ id: 'manifest' });
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
      manifest.add(name, { type: 'literal', store });
    }

    // set
    this.#_cache.set('manifest', manifest);
    // return
    return manifest;
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

    // do the discovery
    const { disabled, enabled, invalids } = require('../utils/get-plugins')(
      this.config.get('plugin.dirs'),
      {
        config: this.config.get(),
        loadOpts: [this],
        type: 'global',
        ...options,
      },
      {
        Config: this.config.constructor,
        Plugin: require('../lib/plugin'),
        debug: this.debug.extend('get-plugins'),
      },
    );

    // set things
    this.#_cache.set('plugins.disabled', disabled);
    this.#_cache.set('plugins.enabled', enabled);
    this.#_cache.set('plugins.invalid', invalids);
    // return
    return enabled;
  }

  getRegistry() {
    return this.manifest.get('registry', { decode: false, encode: false });
  }

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
    if (plugin.type === 'core') throw new Error(`${plugin.name} is a core plugin and cannot be removed`);

    // if we get here then remove the plugin
    plugin.remove();

    // reinit
    this.#_reint();

    // return the plugin
    return plugin;
  }

  async runHook(event, data) {
    return require('../utils/run-hook')(event, data, this.hooks, { [this.id]: this, product: this }, this.debug);
  }
}

export default Product;
