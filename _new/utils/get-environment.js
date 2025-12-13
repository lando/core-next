/**
 * Return the current process environment object.
 *
 * @returns {NodeJS.ProcessEnv} Environment variables.
 */
export default function getEnvironment() {
  const { env = {} } = process;
  return env;
}
