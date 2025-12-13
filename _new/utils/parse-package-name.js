import npmPkgArg from 'npm-package-arg';

/**
 * Parse an npm package specifier and augment its result.
 *
 * @param {string} plugin - Package specifier string.
 * @returns {import('npm-package-arg').Result} Parsed result with additional fields.
 */
export default function parsePkgName(plugin /* { /*defaultTag = 'stable' } = {}*/) {
  // parse the plugin
  const result = npmPkgArg(plugin);

  // add a package property
  result.package = result.scope ? result.name.replace(`${result.scope}/`, '') : result.name;
  // if we have an explict non-tag peg then lets set it
  if (result.type !== 'tag') result.peg = result.saveSpec || result.rawSpec;
  else if (result.rawSpec !== '') result.peg = result.rawSpec;

  // return
  return result;
}
