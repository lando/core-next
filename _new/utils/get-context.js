import getEnvironment from './get-environment.js';
import getPlatform from './get-platform.js';

/**
 * Determine the runtime context of the current process.
 *
 * @returns {string} One of `remote`, `server`, `ci`, or `local`.
 */
export default function getContext() {
  // get needed envvars
  const { CI, CODESPACES, DISPLAY, GITPOD_WORKSPACE_ID, SSH_CLIENT, SSH_TTY } = getEnvironment();

  // running on a remote development option
  if (GITPOD_WORKSPACE_ID || CODESPACES) return 'remote';
  // running on a remote linux server
  if (getPlatform() === 'linux' && (SSH_CLIENT || SSH_TTY) && !DISPLAY) return 'server';
  // running in a CI environment
  if (CI) return 'ci';
  // running locally
  return 'local';
}
