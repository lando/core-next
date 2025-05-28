import path from 'node:path';

import getEnvironment from './get-environment.js';
import getPlatform from './get-platform.js';

const env = getEnvironment();

/*
 * TBD
 */

// @TODO: this needs to use getPlatform()?

export default (id = 'devtool') => {
  switch (getPlatform()) {
    case 'darwin':
      return path.join('/', 'Library', 'Application Support', `${id[0].toUpperCase()}${id.slice(1).toLowerCase()}`);
    case 'linux':
    case 'wsl':
      return path.join('/', 'srv', `${id.toLowerCase()}`);
    case 'win32':
      return path.join(env.PROGRAMDATA ?? env.ProgramData, `${id[0].toUpperCase()}${id.slice(1).toLowerCase()}`);
  }
};
