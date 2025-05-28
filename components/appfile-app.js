'use strict';

const fs = require('fs');
const get = require('lodash/get');
const path = require('path');
const slugify = require('slugify');

const App = require('../lib/app');

class AppfileApp extends App {
  static debug = require('../lib/debug')('@lando/core:appfile-app');
  static name = 'appfile-app';

  static read(file, options) {
    return require('../utils/read-file')(file, options);
  }

  static write(file, data, options) {
    return require('../utils/write-file')(file, data, options);
  }

  static getAppfiles(files = [], { base = process.cwd(), ext = 'yaml', file = '.lando' } = {}) {
    return (
      files
        // assemble the filename/type
        .map((type) => ({
          filename: type === '' ? `${file}.${ext}` : `${file}.${type}.${ext}`,
          type: type === '' ? 'main' : type,
        }))
        // get the absolute paths
        .map((appfile) => ({ type: appfile.type, path: path.join(base, appfile.filename) }))
        // filter out ones that dont exist
        .filter((appfile) => fs.existsSync(appfile.path))
        // merge in includes
        .map((appfile) => {
          // see if we have any includes
          const includes = get(AppfileApp.read(appfile.path), 'includes');
          if (includes) {
            const appfiles = AppfileApp.getAppfiles(typeof includes === 'string' ? [includes] : includes, {
              base,
              ext,
              file,
            });
            return [...appfiles, appfile];
          }
          // otherwise arrify and return
          return [appfile];
        })
        // flatten
        .flat(Number.POSITIVE_INFINITY)
    );
  }

  static getId(idFile, { debug = AppfileApp.debug } = {}) {
    // first try the idFile
    if (fs.existsSync(idFile)) {
      debug('trying to get id from %o', idFile);
      try {
        return fs.readFileSync(idFile, 'utf8');
      } catch {
        debug('could not get id from %o', idFile);
      }
    }

    // if that fails then
    const id = require('../utils/generate-id')();

    // @TODO: how should we actually persist the id?
    // should we just write to the landofile? that already exists and would be easier than handling
    // creation of `.lando/id` and asking user to gitignore or not?
    //
    // but i guess for now: write to this.idPath
    fs.mkdirSync(path.dirname(idFile), { recursive: true });
    fs.writeFileSync(idFile, id);
    debug('generated id %o', id);
    return id;
  }

  constructor({ appfile, config, product, plugins = {}, debug = AppfileApp.debug } = {}) {
    // @TODO: throw error if no name?
    // @TODO: throw error if config is no good

    // extract read/write from config and set it statically
    // @NOTE: we do this because it saves time
    const { read, write } = config.constructor;
    AppfileApp.read = read;
    AppfileApp.write = write;

    // immediately do what we can do invoke super
    const mainfileData = AppfileApp.read(appfile);

    const name = slugify(mainfileData.name, { lower: true, strict: true });
    const prod = product || config.get('system.product') || 'lando';
    debug = debug.extend(name);

    // paths
    const root = path.dirname(appfile);
    const repoDir = path.join(root, `.${prod}`);

    // get resolved list of appfiles to load
    const appfiles = AppfileApp.getAppfiles(
      get(mainfileData, 'config.core.appfiles', config.get('core.appfiles') || ['']),
      {
        base: path.dirname(appfile),
        ext: appfile.split('.').pop(),
        file: path.basename(appfile, `.${appfile.split('.').pop()}`),
      },
    );

    // build the app config
    const appConfig = config.newConfig({ managed: 'main', id: name, debug: debug.extend('config') });
    // then load in app envvars
    appConfig.env(`${prod}-${name}`.toUpperCase().replace(/-/gi, '_'));
    // then load in all appfiles in reverse order
    appfiles.reverse().forEach((appfile) => appConfig.file(appfile.type, appfile.path));
    // and then finally the defaults
    appConfig.defaults('defaults', require('../workspace/appfile-app-defaults')());

    // add standard plugin directory for a cli api and normalize all to root
    // @TODO: should this be something else? pluginDirs is a "legacy" key
    appConfig.set('plugin-dirs', [
      ...appConfig.get('plugin-dirs').map((dir) => path.resolve(root, dir)),
      path.join(repoDir, 'plugins'),
    ]);
    // similarly path normalize any plugins in appconfig that are local
    appConfig.set(
      'plugins',
      Object.fromEntries(
        Object.entries(appConfig.getUncoded('plugins')).map((plugin) => [
          plugin[0],
          fs.existsSync(path.join(root, plugin[1])) ? path.join(root, plugin[1]) : plugin[1],
        ]),
      ),
    );

    // figure out the id
    // @NOTE: should we allow this to be passed in?
    let id = appConfig.get('id') || AppfileApp.getId(path.join(repoDir, 'id'), { debug });
    // we shoud be able to invoke super now
    super({ name, appConfig, config, debug: debug.contract(-1), id, plugins, product: prod });

    // now we can do this thang
    // add things to config?
    this._appfile = appfile;
    this._appfiles = appfiles;
    this.root = root;
    this.sluggypath = slugify(this.root, { lower: true, strict: true });
  }
}

module.exports = AppfileApp;
