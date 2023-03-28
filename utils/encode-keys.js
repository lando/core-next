'use strict';

const isObject = require('lodash/isPlainObject');

module.exports = data => {
  // return non objects with no mutation
  if (!isObject(data)) return data;
  // mutate keys and return unless the key is in plugin format
  return require('kebabcase-keys')(data, {deep: true, exclude: [new RegExp('(^@).*/')]});
};
