'use strict';

const isObject = require('lodash/isPlainObject');

module.exports = data => {
  // return non objects with no mutation
  if (!isObject(data)) return data;
  // mutate keys and return
  return require('camelcase-keys')(data, {deep: true});
};
