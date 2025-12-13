/* eslint-disable complexity */
/**
 * Construct a standardized Error object from command output.
 *
 * @param {object} params - Command results and meta data.
 * @param {string} [params.all] - Combined stdout/stderr.
 * @param {string[]} [params.args]
 * @param {string} [params.code]
 * @param {string} [params.command]
 * @param {Error} [params.error]
 * @param {string} [params.errorCode]
 * @param {number} [params.exitCode]
 * @param {string} [params.short]
 * @param {number} [params.statusCode]
 * @param {string} [params.stdout]
 * @param {string} [params.stderr]
 * @returns {Error} Normalized error instance.
 */
export default function makeError({ all, args, code, command, error, errorCode, exitCode, short, statusCode, stdout, stderr }) {
  // attempt to discover various codes
  code = (error && error.code) || code || undefined;
  errorCode = (error && error.code) || errorCode || undefined;
  statusCode = (error && error.statusCode) || statusCode || undefined;

  // construct a better message
  // @TODO: does this make sense?
  short = short || (error && error.reason) || (error && error.body && error.body.error);
  const message = [stdout, stderr].filter(Boolean).join('\n') || all;

  // repurpose original error if we have one
  if (Object.prototype.toString.call(error) === '[object Error]') {
    error.originalMessage = error.message;
    error.message = message || error.originalMessage || short || stdout || stderr || all;

    // otherwise begin anew
  } else {
    error = new Error(message);
  }

  // Try to standardize things
  error.all = all;
  error.code = code;
  error.command = command;
  error.args = args;
  error.errorCode = errorCode;
  error.exitCode = exitCode;
  error.short = short || message || stdout || stderr || all;
  error.statusCode = statusCode;
  error.stdout = stdout;
  error.stderr = stderr;

  // @TODO: filter out unset properties?
  // send it back
  return error;
}
