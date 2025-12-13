/**
 * Produce a standardized success result.
 *
 * @param {object} params - Command metadata.
 * @param {string} params.all - Combined output.
 * @param {string[]} params.args - Arguments passed to the command.
 * @param {string} params.command - The command executed.
 * @param {string} params.stdout - Standard output.
 * @param {string} params.stderr - Standard error.
 * @returns {object} Success information object.
 */
export default function makeSuccess({ all, args, command, stdout, stderr }) {
  return {
    command,
    args,
    exitCode: 0,
    stdout,
    stderr,
    all,
  };
}
