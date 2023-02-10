'use strict';

const fs = require('fs');
const get = require('lodash/get');
const path = require('path');
const slugify = require('slugify');
const yaml = require('yaml');

const App = require('../lib/app');
const Config = require('../lib/config');

class CliApp extends App {
  static debug = require('../lib/debug')('@lando/core:landofile-v3-app');
  static name = 'landofile-v3-app';

  static getAppfiles(files = [], {
    base = process.cwd(),
    ext = 'yaml',
    file = '.lando',
  } = {}) {
    return files
    // assemble the filename/type
    .map(type => ({
      filename: type === '' ? `${file}.${ext}` : `${file}.${type}.${ext}`,
      type: type === '' ? 'main' : type,
    }))
    // get the absolute paths
    .map(appfile => ({type: appfile.type, path: path.join(base, appfile.filename)}))
    // filter out ones that dont exist
    .filter(appfile => fs.existsSync(appfile.path))
    // merge in includes
    .map(appfile => {
      // see if we have any includes
      const includes = get(yaml.parse(fs.readFileSync(appfile.path, 'utf8')), 'includes');
      if (includes) {
        const appfiles = CliApp.getLandofiles((typeof includes === 'string') ? [includes] : includes, {base, ext, file});
        return [...appfiles, appfile];
      }
      // otherwise arrify and return
      return [appfile];
    })
    // flatten
    .flat(Number.POSITIVE_INFINITY);
  }

  static getId(idFile, {debug = CliApp.debug} = {}) {
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
    fs.mkdirSync(path.dirname(idFile), {recursive: true});
    fs.writeFileSync(idFile, id);
    debug('generated id %o', id);
    return id;
  }

  constructor({
    appfile,
    config,
    product,
    plugins = {},
    debug = CliApp.debug,
  } = {}) {
    // @TODO:
    // throw error if no name?
    // throw error if config is no good
    // do we need an appfiles prop? throw error if we do?

    // immediately do what we can do invoke super
    const mainfileData = yaml.parse(fs.readFileSync(appfile, 'utf8'));
    const name = slugify(mainfileData.name, {lower: true, strict: true});
    const prod = product || config.get('system.product') || 'lando';
    debug = debug.extend(name);

    // paths
    const root = path.dirname(appfile);
    const repoDir = path.join(root, `.${prod}`);

    // get resolved list of appfiles to load
    // @NOTE: appfiles can only be overridden in the main appfile for, we hope, obvious reasons
    const appfiles = CliApp.getAppfiles(get(mainfileData, 'config.core.appfiles', config.get('core.appfiles') || ['']), {
      base: path.dirname(appfile),
      ext: appfile.split('.').pop(),
      file: path.basename(appfile, `.${appfile.split('.').pop()}`),
    });

    // build the app config
    const appConfig = new Config({
      managed: 'main',
      env: `${prod}-${name}`.toUpperCase().replace(/-/gi, '_'),
      id: name,
      sources: {
        defaults: path.resolve(__dirname, '..', 'config', 'landofile-v3-app-defaults.js'),
        ...Object.fromEntries(appfiles.map(appfile => ([appfile.type, appfile.path]))),
      },
    });

    // frontload a standard plugin directory for a cli api and normalize all to root
    appConfig.set('plugin-dirs', [...appConfig.get('plugin-dirs').map(dir => path.resolve(root, dir)), path.join(repoDir, 'plugins')]);

    // similarly path normalize any plugins in appconfig that are local
    appConfig.set('plugins', Object.fromEntries(Object.entries(appConfig.getUncoded('plugins'))
      .map(plugin => ([
        plugin[0],
        fs.existsSync(path.join(root, plugin[1])) ? path.join(root, plugin[1]) : plugin[1],
      ]))));

    // figure out the id
    // @NOTE: should we allow this to be passed in?
    let id = appConfig.get('id') || CliApp.getId(path.join(repoDir, 'id'), {debug});

    // we shoud be able to invoke super now
    super({name, appConfig, config, debug: debug.contract(-1), id, plugins, product: prod});

    // now we can do this thang
    this._appfile = appfile;
    this._appfiles = appfiles;
    this.root = root;
    this.sluggypath = slugify(this.root, {lower: true, strict: true});
  }
};

module.exports = CliApp;
