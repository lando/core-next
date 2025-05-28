#!/usr/bin/env node --dns-result-order=ipv4first

/**
 * devtool
 *
 * @name devtool
 */
import argv from '@lando/argv';

import Cli from '../lib/cli.js';

// cli opts
const options = {
  cache: !argv.hasOption('--clear') && !argv.hasOption('--no-cache'),
  enableDebugger: false,
};

// if DEBUG is set then unset it, we dont want it to toggle any debugging inside of lando
// @NOTE: are we sure? or at the very least are we sure dont want to do something with its value?
if (process.env.DEBUG) delete process.env.DEBUG;

// start assessing debug situation with DEVTOOL_DEBUG
if (process.env.DEVTOOL_DEBUG) {
  options.enableDebugger =
    process.env.DEVTOOL_DEBUG === 1 ||
    process.env.DEVTOOL_DEBUG === '1' ||
    process.env.DEVTOOL_DEBUG === true ||
    process.env.DEVTOOL_DEBUG === 'true'
      ? true
      : process.env.DEVTOOL_DEBUG;
}

// and finally prefer --debug
if (argv.hasOption('--debug')) options.enableDebugger = argv.getOption('--debug', { defaultValue: 'devtool*' });

// construct the cli
const cli = new Cli(options);

// run the cli
// @TODO: where does flush and handle go?
// // run our oclifish CLI
// cli.run().then(flush).catch(handle);
cli.run();
