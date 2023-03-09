'use strict';

// @TODO: throw error for nully values?
module.exports = data => {
  // if we have a nully value then just return
  if (data === null || data === undefined) return data;
  // if string then return
  if (typeof data === 'string') return data.split('.').map(part => require('lodash/kebabCase')(part)).join('.');
  // if array then map and return
  if (Array.isArray(data)) return data.map(prop => prop.split('.').map(part => require('lodash/kebabCase')(part)).join('.'));
  // else assume object and return
  return require('kebabcase-keys')(data, {deep: true});
};
