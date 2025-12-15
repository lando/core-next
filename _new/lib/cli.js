import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import Debug from 'debug';
import isObject from 'lodash-es/isPlainObject.js';

import Config from '../lib/config.js';
import createDebug from '../lib/debug.js';
import getCacheDir from '../utils/get-cache-dir.js';
import getObjectSizes from '../utils/get-object-sizes.js';
import getSize from '../utils/get-size.js';
import getSystemDataDir from '../utils/get-system-data-dir.js';
import normalizeManifestPaths from '../utils/normalize-manifest-paths.js';
import getDefaultConfig from '../utils/get-default-config.js';
import runHook from '../utils/run-hook.js';

// oclif
import { CLIError } from '@oclif/core/errors';
import { Config as OConfig } from '@oclif/core/config';
import { Flags, flush, handle } from '@oclif/core';
import { normalizeArgv } from '@oclif/core/help';
import { parse } from '@oclif/core/parser';

// get __dirname
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// default consts
const PRODUCT_ID = path.basename(process.argv[1]) || 'lando';
const PRODUCT_ROOT = path.resolve(__dirname, '../..');

// default cli options
const defaultOptions = {
  cache: true,
  cacheDir: getCacheDir(PRODUCT_ID),
  configTemplates: {
    global: (await import('../config/global.cjs', { with: { type: 'file' } })).default,
    user: (await import('../config/user.yaml', { with: { type: 'file' } })).default,
  },
  cid: PRODUCT_ID,
  debug: createDebug(PRODUCT_ID),
  enableDebugger: false,
  hooks: {},
  plugins: [],
  pjson: await import('../../package.json'),
  root: PRODUCT_ROOT,
};

/*
 * swallows stdout epipe errors
 * this occurs when stdout closes such as when piping to head
 */
process.stdout.on('error', (err) => {
  if (err && err.code === 'EPIPE') return;
  throw err;
});

/*
 * Construct the CLI
 */
export default class Cli {
  static id = PRODUCT_ID;
  static defaults = defaultOptions;
  static globalFlags = {
    'clear': Flags.boolean({ hidden: true }),
    'config': Flags.string({
      char: 'c',
      description: 'use configuration from specified file',
      env: `${PRODUCT_ID.toUpperCase()}_CONFIG_FILE`,
      default: undefined,
      hidden: true,
      helpGroup: 'GLOBAL',
    }),
    'debug': Flags.boolean({ hidden: false }),
    'no-cache': Flags.boolean({ hidden: false }),
  };

  #_cache;
  #_oclif;

  constructor({
    id = Cli.id,
    cache = Cli.defaults.cache,
    cacheDir = Cli.defaults.cacheDir,
    configTemplates = Cli.defaults.configTemplates,
    cid = Cli.defaults.cid,
    debug = Cli.defaults.debug,
    enableDebugger = Cli.defaults.enableDebugger,
    hooks = Cli.defaults.hooks,
    plugins = Cli.defaults.plugins,
    root = Cli.defaults.root,
  } = {}) {
    // id
    this.id = id;

    // other propz
    this.cache = cache;
    this.cacheDir = cacheDir;
    this.cid = this.id || cid;
    this.configTemplates = configTemplates;
    this.debug = debug;
    this.hooks = hooks;
    this.plugins = plugins;
    this.root = root;

    // enable debug if needed
    if (enableDebugger !== false) this.enableDebugger(enableDebugger);

    // some debugging about what happened
    this.debug('instantiated cli %o with %O', this.id, {
      cache: this.cache,
      cacheDir: this.cacheDir,
      configTempltes: this.configTemplates,
      hooks: this.hooks,
      plugins: this.plugins,
      root: this.root,
    });

    // @TODO: other stuff eg version?
  }

  async #getStorageBackend(cache = this.cache) {
    // @IDEA: get this from core plugin manifest?
    const backends = {
      'file-storage': () => import('../components/file-storage.js'),
      'no-storage': () => import('../components/no-storage.js'),
    };

    const { default: StorageBackend } = await backends[cache === true ? 'file-storage' : 'no-storage']();

    return StorageBackend;
  }

  async #generateConfigTemplates(templates = [], genOpts = {}) {
    // filter out stuff so we only end up with stuff we actually need to template
    templates = templates.filter(([source, dest, options = {}]) => {
      // if there is no source
      if (source === undefined || source === null || !fs.existsSync(source)) return false;
      // if we are not overwriting and the dest already exists
      if (options.overwrite !== true && fs.existsSync(dest)) return false;
      // templator
      return true;
    });

    if (templates.length > 0) {
      const { default: Templator } = await import('../lib/templator.js');
      for (const [source, dest, options] of templates) {
        const templator = new Templator(source, dest, { debug: this.debug.extend('templator'), ...options });
        templator.generate(genOpts);
      }
    }
  }

  enableDebugger(namespace) {
    // normalize namespace to a string
    namespace = typeof namespace === 'string' ? namespace : `${this.id}*`;
    // activate
    Debug.enable(namespace);
  }

  async execute() {
    if (!this.root) {
      throw new CLIError('root is required.');
    }

    console.log(await import('../config/user.yaml', { with: { type: 'file' } }));
    process.exit(1);
    return this.run(this.args ?? process.argv.slice(2))
      .catch(async (error) => handle(error))
      .finally(async () => flush());
  }

  async init() {
    // @TODO: allow this to only run once eg if #_oclif is set then just return that?
    // @TODO: do we need anything dynamic from oclif? hooks?
    // @TODO: do we want to allow plugins?

    // get the oclif config

    const oclif = await OConfig.load(this.root);

    // parse flags and args as best we can

    // augment with additional properties
    oclif.id = this.id;
    oclif.cache = this.cache;
    oclif.configCache = path.join(oclif.cacheDir, `${this.id}-config.json`);
    oclif.coreDir = this.root;
    oclif.debuggerEnabled = this.debug.enabled;
    oclif.env = this.id.toUpperCase();
    oclif.logger = this.debug;
    oclif.sysdataDir = getSystemDataDir(this.id);

    // add in some config info
    oclif.sysConfigFile = path.join(oclif.sysdataDir, 'config.json');
    oclif.globalConfigFile = path.join(oclif.dataDir, 'config.json');
    oclif.userConfigFile = path.join(oclif.configDir, 'config.yaml');

    if (isObject(this.configTemplates) && getSize(this.configTemplates) > 0) {
      await this.#generateConfigTemplates(
        [
          [this.configTemplates.system, oclif.sysConfigFile],
          [this.configTemplates.global, oclif.globalConfigFile, { overwrite: true }],
          [this.configTemplates.user, oclif.userConfigFile],
        ],
        { funcOpts: oclif, readOpts: { fullYamlDoc: true } },
      );
    }

    // return
    return oclif;
  }

  // @TODO: add support for options.args?
  async parse(argv = process.argv.slice(2), options = {}) {
    // NOTE: we are only interested in parsing and normalizing so its ok for validation to fail
    try {
      options._parsed = await parse(argv, { strict: false, flags: Cli.globalFlags, ...options });
    } catch (error) {
      options._parsed = error.parse.output;
    }

    // return the same as oclif for compatibility
    return options._parsed;
  }

  /*
   * Run the CLI
   */
  async run(argv = process.argv.slice(2), options = {}) {
    this.debug('running cli with argv %o and options %o', argv, options);

    // parse argv
    // @TODO: where does this stuff go?
    // parses options, flags, command, sets into this?
    // const parsed = await this.parse(argv, options);

    // await this.init?
    // loads oclif config so we can generate config templates
    // store oclif on private prop for hell of it?
    // also merges in any hooks?
    // @NOTE: these templates should not contain dyanmic data like debug or argv?
    // @NOTE: this stealth maps in oclif stuff?
    // this.#_oclif = await this.#oclifinit();

    // await this.load
    const oclif = await this.init();
    console.log(oclif);
    process.exit(1);
    // assembles the config

    console.log('hello devtool');
    process.exit(0);

    // get app
    // get storage
    // get commands
    // get help

    // select correct storage backend and setup cache
    const StorageBackend = await this.#getStorageBackend();
    this.#_cache = new StorageBackend({ debug: this.debug.extend('#cache'), dir: this.cacheDir });
    this.debug('caching %o with %o %o', this.cache, this.#_cache.constructor.name, this.#_cache.dir);

    // if cache is disabled and cachedir exist then flush it
    if (!this.cache && fs.existsSync(this.cacheDir)) StorageBackend.flush(this.cacheDir, this.debug.extend('#flush'));

    // debug if flag config file doesnt exist
    // @NOTE: should this be a proper error?
    // @NOTE: should we try to get an absolute path?
    if (this.flags.config && !fs.existsSync(this.flags.config)) {
      this.debug('tried to load %o into config but it doesnt exist', this.flags.config);
    }

    // normalize our argv
    // @TODO: this does not handle non-command stuff well?
    // @TODO: revisit?
    const [id, ...argvSlice] = normalizeArgv(this.#_oclif, this.#_oclif.argv);

    // set command and remaining args
    this.command = id;

    console.log(this, argvSlice);
    process.exit(1);

    // generate config templates if needed?
    // @TODO: should this end up in getConfig?

    // rework oclif conf a bit before we merge
    process.exit(1);

    // debug
    this.debug('running command %o with args %o', id, argvSlice);

    // get early oclif hooks, these are special hooks you can use to mutate the cli config before we start
    // to look for an app
    const ohooks = oclif
      .getPluginsList()
      .map((plugin) => normalizeManifestPaths({ hooks: plugin.hooks }, plugin.root))
      .map((plugin) => plugin.hooks)
      .filter((hooks) => Object.keys(hooks).length > 0);

    if (ohooks.length > 0) this.hooks = Config.merge(this.hooks, ohooks, ['aoa']);
    this.debug('found early run oclif hooks %o', getObjectSizes(this.hooks));

    // start our config collection and load config sources in decreasing priority
    // @TODO: move hooks up here so we can use them in getConfig()?
    // @TODO: optimize this somehow? only generate config if needed? use cache?
    const config = new Config({
      cached: oclif.configCache,
      debug: this.debug.extend('config'),
      env: this.env,
      id: this.id,
      managed: 'global',
    });

    // pre-config hook
    //
    // because this event runs BEFORE lando is ready you cannot access it through a lando plugin. instead you need to use
    // an OCLIF hook.
    // See: https://oclif.io/docs/hooks.
    //
    // FWIW if you are interested in modifying things at this level you should probably just get in touch with us
    // see: https://lando.dev/support
    await this.runHook('pre-config', { config });

    // if we have a CLI provided config source then thats first
    if (oclif.configFile) config.overrides('userfile', Config.read(oclif.configFile), { encode: false });
    // then load in product envvars
    config.env(this.id);
    // then the user config
    config.file('user', oclif.userConfigFile);
    // then the global/managed config
    config.file('global', oclif.globalConfigFile);
    // then system configuration if it exits
    if (fs.existsSync(oclif.sysConfigFile)) config.file('system', oclif.sysConfigFile);
    // then defaults
    config.defaults('defaults', getDefaultConfig(this.id));
    // dump cache
    config.dump();
    // this.debug('oclif config loaded %O', oclif);
    await this.runHook('post-config', { config });
    process.exit(1);

    // const config = getProductConfig(oclif);

    // console.log(getDefaultConfig(this.id));
    // console.log(config.get());
    process.exit(1);

    // this.debug('going to use %o as product', minstrapper.product);

    // // use the minstrapper 2 get da product/lando
    // // we call it "Product" here instead of "Lando" because at this point we want to keep it generic
    // // once we are "downstream" we use Lando/lando as a convention even if the product id is not lando
    // const Product = require(minstrapper.product);
    // // renamespace some debuggerrs
    // Product.debug = this.debug.contract(-1).extend(this.id);
    // minstrapper.config.debug = Product.debug.extend('config');

    // // instantiate
    // // @NOTE: we pass in Config, Backend etc because its saves us a good .3s which is a lot in a CLI boot
    // this.product = new Product(minstrapper.config, { StorageBackend: this.StorageBackend });
    // this[this.id] = this.product;

    // // Run the product bootstrap
    // try {
    //   await this.product.bootstrap(this);
    //   this.debug('product %o bootstrap completed successfully', this.product.id);
    // } catch (error) {
    //   console.error('Bootstrap failed!'); // eslint-disable-line no-console
    //   this.exitError(error);
    // }

    // // determine if we have an app or not
    // // @TODO: findApp is pretty CLI specific? shoudl we have getUtil for this?
    // const appfile = this.product.config.get('core.appfile');
    // const appfiles = [`${appfile}.yaml`, `${appfile}.yml`];
    // const appfilePath = this.product.findApp(appfiles, process.cwd());

    // // if we have an file then lets set some things in the config for downstream purposes
    // if (fs.existsSync(appfilePath)) {
    //   // Also get our app object
    //   const App = this.product.getComponent('core.app');
    //   this.debug('discovered a %o app at %o', App.name, path.dirname(appfilePath));

    //   // override some default static properties
    //   App.debug = this.debug.contract(-1);
    //   this.app = new App({
    //     appfile: appfilePath,
    //     config: this.product.config,
    //     plugins: this.product.plugins,
    //     StorageBackend: this.StorageBackend,
    //   });
    // }

    // // determine some context stuff
    // this.context = { app: this.app !== undefined, global: this.app === undefined };
    // this.ctx = this.context.app ? this.app : this.product;
    // this.cid = this.context.app ? this.app.id : this.product.id;
    // this.debug('command is running with context %o and cid %o', this.context, this.cid);

    // // merge in additinal hooks from the context
    // config.merge(this.hooks, [this.getHooks(this.ctx)], ['concat']);
    // this.debug('found %o hooks %o', 'cli', require('../utils/get-object-sizes')(this.hooks));
    // // get tasks
    // this.tasks = this.getTasks(this.ctx);
    // // get help https://www.youtube.com/watch?v=CpZakOJlRoY&t=30s
    // this.help = this.getHelp(this.tasks, [this]);

    // // init hook
    // await this.runHook('init', { id, argv: argvSlice });

    // // Initialize
    // const suffix = this.app ? `(${this.app.name}, v4)` : '(v4)';
    // const cmd = !this.product.config.get('system.packaged') ? '$0' : path.basename(process.execPath) || 'lando';
    // const usage = [`Usage: ${cmd} <command> [args] [options] | ${chalk.magenta(suffix)}`];

    // // Yargs!
    // yargs
    //   .usage(usage.join(' '))
    //   .example(`${this.id} start`, 'starts up the app in cwd')
    //   .example(`${this.id} rebuild --help`, 'displays help about the rebuild command')
    //   .example(`${this.id} destroy -y --debug`, 'runs destroy non-interactively and with debug output')
    //   .example(`${this.id} --no-cache`, 'disables and wipes cache')
    //   .recommendCommands()
    //   .showHelpOnFail(false)
    //   .wrap(yargs.terminalWidth() * 0.7)
    //   .option('channel', globalOptions.channel)
    //   .option('clear', globalOptions.clear)
    //   .option('debug', globalOptions.debug)
    //   .option('experimental', globalOptions.experimental)
    //   .option('no-cache', globalOptions['no-cache'])
    //   .help(false)
    //   .option('lando', globalOptions.lando)
    //   .option('help', globalOptions.help)
    //   .option('verbose', globalOptions.verbose)
    //   .group('clear', chalk.green('Global Options:'))
    //   .group('debug', chalk.green('Global Options:'))
    //   .group('help', chalk.green('Global Options:'))
    //   .group('no-cache', chalk.green('Global Options:'))
    //   .version(false);

    // // loop through the tasks and add them to the CLI
    // for (const task of this.help) {
    //   if (task.handler) yargs.command(task);
    //   else yargs.command(await this.parseToYargs(task));
    // }

    // // try to get the current tasks
    // const current = this.help.find((task) => task.command === id);

    // // if we cannot get teh current tasks then show help
    // if (!current) {
    //   yargs.showHelp();
    //   this.log();
    // }

    // // Show help unless this is a delegation command
    // if ((yargs.argv.help || yargs.argv.lando) && current.delegate !== true) {
    //   yargs.showHelp('log');
    //   this.log();
    //   process.exit(0);
    // }

    // // YARGZ MATEY
    // yargs.argv;
  }

  reinit(cid = this.cid) {
    this.#_cache.remove([cid, 'tasks']);
    this.#_cache.remove([cid, 'help']);
  }

  async runHook(event, data) {
    return runHook(event, data, this.hooks, { cli: this }, this.debug, this.exitError);
  }
}
