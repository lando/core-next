import fs from 'node:fs';
import util from 'node:util';

/**
 * Returns the default export
 */
export default async function loadComponent(component) {
  // we do anonymous functions first so they can hypothetically resolve to downstream things like paths
  if (typeof component === 'function' && component.name === '') component = { loader: component };
  // if component is an object with "load" property then just reassign
  if (typeof component === 'object' && typeof component.load === 'function') component = { ...component, loader: component.load };
  // if component is an object with "loader" function then just invoke
  if (typeof component === 'object' && typeof component.loader === 'function') component = await component.loader();

  // if component is a string that exists then attempt to load it
  if (typeof component === 'string' && fs.existsSync(component)) component = await import(component);

  // if component is not a module by now then lets fake it
  if (!util.types.isModuleNamespaceObject(component)) component = { default: component };

  // @TODO: do we check stuff here or should component validation be done where implementation happens?
  return component.default;
}
