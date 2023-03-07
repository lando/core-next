'use strict';

module.exports = data => {
  // transform to array if string
  if (typeof data === 'string') data = [data];

  // if array then map and return
  if (Array.isArray(data)) {
    return data.map(prop => prop.split('.').map(part => require('lodash/kebabCase')(part)).join('.'));
  }

  // else assume object and return
  return require('kebabcase-keys')(data, {deep: true});
};
