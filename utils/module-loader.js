import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';

import getPackageType from 'get-package-type';

const require = createRequire(import.meta.url);

/**
 * Defines file extension resolution when source files do not have an extension.
 */
const SUPPORTED_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs', '.mts', '.cts', '.tsx', '.jsx'];

function handleError(error, isESM, pathStr) {
  if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
    throw new Error(`${isESM ? 'import()' : 'require'} failed to load ${pathStr}: ${error.message}`);
  }
  throw error;
}

/**
 * Loads a module and returns an object with the module and data about the module.
 *
 * @param {Object} config - Oclif config or plugin config.
 * @param {string} modulePath - NPM module name or file path to load.
 * @returns {Promise<{filePath: string, isESM: boolean, module: *}>}
 */
async function load(file) {
  let isESM;

  try {
    ({ file, isESM } = await resolvePath(file));

    // if not esm then just return the require
    if (!isESM) return { file, isESM, module: require(file) };

    // otherwise return the default esm export
    const { default: module } = await import(url.pathToFileURL(file).href);
    return { file, isESM, module };
  } catch (error) {
    handleError(error, isESM, file);
  }
}

/**
 * Determines if the file at filePath should be treated as an ES Module.
 *
 * For .js, .jsx, .ts, .tsx files it uses getPackageType.sync;
 * for .mjs or .mts it assumes the file is an ES Module.
 *
 * @param {string} filePath - File path to test.
 * @returns {boolean}
 */
function isPathModule(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
      return getPackageType.sync(filePath) === 'module';
    case '.mjs':
    case '.mts':
      return true;
    default:
      return false;
  }
}

/**
 * Resolves a module path.
 *
 * First uses require.resolve to allow Node to locate an installed module.
 * If that fails, falls back to a resolution using tsPath based on config.root.
 * If the file does not exist, attempts to find it by trying supported extensions.
 *
 * @param {Object} config - Oclif config or plugin config.
 * @param {string} modulePath - File path to load.
 * @returns {Promise<{filePath: string, isESM: boolean}>}
 */
async function resolvePath(file) {
  let isESM;
  try {
    file = require.resolve(file);
    isESM = isPathModule(file);
  } catch {
    let fileExists = false;
    let isDirectory = false;
    if (fs.existsSync(file)) {
      fileExists = true;
      try {
        if (fs.lstatSync(file).isDirectory()) {
          fileExists = false;
          isDirectory = true;
        }
      } catch (e) {
        // Ignore errors during lstat
      }
    }
    if (!fileExists) {
      let foundPath = findFile(file);
      if (!foundPath && isDirectory) {
        foundPath = findFile(path.join(file, 'index'));
      }
      if (foundPath) {
        file = foundPath;
      }
    }
    isESM = isPathModule(file);
  }
  return { file, isESM };
}

/**
 * Attempts to find a file by trying supported extensions.
 *
 * @param {string} filePath - File path without extension.
 * @returns {string|null} The file path with extension if found; otherwise, null.
 */
function findFile(filePath) {
  for (const extension of SUPPORTED_EXTENSIONS) {
    const testPath = `${filePath}${extension}`;
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }
  return null;
}

export default load;
