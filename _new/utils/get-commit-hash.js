import fs from 'node:fs';
import path from 'node:path';

/**
 * Retrieve a git commit hash from a repository directory.
 *
 * @param {string} dir - Path to the git repository.
 * @param {object} [options]
 * @param {string} [options.refFile] - Path to the ref file to read.
 * @param {boolean} [options.short=false] - Whether to return the short hash.
 * @returns {string|false} The commit hash or `false` if it cannot be found.
 */
export default function getCommitHash(dir, { refFile = path.join(dir, '.git', 'HEAD'), short = false } = {}) {
  // if reffile doesnt exist then return false
  if (!fs.existsSync(refFile)) return false;

  const gitBase = path.join(dir, '.git');

  // if the refFile has another ref in it then we need to reset the reffile
  if (fs.readFileSync(refFile, { encoding: 'utf-8' }).startsWith('ref: ')) {
    const contents = fs.readFileSync(refFile, { encoding: 'utf-8' }).trim();
    const parts = contents.split('ref: ');
    const ref = parts[1] ? parts[1] : 'HEAD';
    refFile = path.join(gitBase, ref);
  }

  // get the commit
  const commit = fs.readFileSync(refFile, { encoding: 'utf-8' }).trim();

  // if we are "short" then return first seven
  if (short && typeof commit === 'string') return commit.slice(0, 7);

  // otherwise just return the whole thing
  return commit;
}
