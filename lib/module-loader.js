'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');

/**
 * Provides a mechanism to use dynamic import / import() with tsconfig -> module: commonJS as otherwise import() gets
 * transpiled to require().
 */
const _importDynamic = new Function('modulePath', 'return import(modulePath)'); // eslint-disable-line no-new-func

/*
 *
 */
class ModuleLoader {
  /*
   *
   */
  static async load(file) {
    let filePath;
    let isESM;
    try {
      ({isESM, filePath} = ModuleLoader.resolvePath(file));
      const module = isESM ? await _importDynamic(url.pathToFileURL(filePath)) : require(filePath);
      return {isESM, module, filePath};
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
        throw new Error(`${isESM ? 'import()' : 'require'} failed to load ${filePath || modulePath}: ${error.message}`);
      }
      throw error;
    }
  }

  /*
   *
   */
  static resolvePath(modulePath) {
    // @NOTE: eventually we should allow ESM as soon as vercel/pkg does?
    const isESM = false;
    let filePath;

    try {
      filePath = require.resolve(modulePath);

    // if we cant resolve then try other stuff;
    } catch {
      let fileExists = false;
      let isDirectory = false;
      if (fs.existsSync(filePath)) {
        fileExists = true;
        try {
          if (fs.lstatSync(filePath)?.isDirectory?.()) {
            fileExists = false;
            isDirectory = true;
          }
        } catch {}
      }

      if (!fileExists) {
        // Try all supported extensions.
        let foundPath = ModuleLoader.findFile(filePath);
        if (!foundPath && isDirectory) {
          // Since filePath is a directory, try looking for index file.
          foundPath = ModuleLoader.findFile(path.join(filePath, 'index'));
        }

        if (foundPath) {
          filePath = foundPath;
        }
      }
    }

    return {isESM, filePath};
  }

  /*
   */
  static findFile(file) {
    for (const extension of ['.js']) {
      const testPath = `${filePath}${extension}`;
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }
    return null;
  }
}

module.exports = ModuleLoader;
