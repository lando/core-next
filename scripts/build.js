/* eslint-disable no-console */
import { build } from 'bun';

import Debug from 'debug';
import chalk from 'chalk';
import argv from '@lando/argv';

import getCommitHash from '../_new/utils/get-commit-hash.js';
import isDevVersion from '../_new/utils/is-dev-version.js';

import { version } from '../package.json';

// colors
const blue = chalk.blue;
const green = chalk.green;
const error = chalk.red.bold;
const warn = chalk.yellow.bold;

const debug = Debug('@lando/bun-build');
const entrypoints = ['./bin/lando.js'];
const options = {
  compile: {
    outfile: './dist/lando',
  },
  // minify: true,
};

const buildenv = {
  __BUILD_IS_COMPILED__: JSON.stringify(true),
  __BUILD_COMMIT__: JSON.stringify(getCommitHash('./', { short: true })),
  __BUILD_DEV__: JSON.stringify(isDevVersion(version)),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __BUILD_VERSION__: JSON.stringify(version),
};

// enable debugging if applicable
if (argv.hasOption('--debug') || process.env.RUNNER_DEBUG == 1) Debug.enable('*');

// attempt the build
console.log(`${blue('compiling')} ${green(entrypoints)}...`);
debug('building %o with options %O and build vars %O', entrypoints, options, buildenv);

const { success, logs, outputs } = await build({ entrypoints, ...options, define: buildenv });

debug('build completed with %s and logs %O', success ? green('success') : error('failure'), logs);

// @NOTE: outputs doent play nice in debug so we do it this way instead
if (debug.enabled) console.log(outputs);

// print error messages and exit
if (!success) {
  for (const message of logs) console.error(error(message));
  process.exit(47);
}

// success
console.log(logs.length > 0 ? `${warn('success')}! with warnings...` : chalk.green.bold('success!'));

// print warnings if applicable
if (logs.length > 0) for (const message of logs) console.warn(message);

// dest
console.log();
console.log(`built to ${green(options.compile.outfile)}`);
