'use strict';

const isObject = require('lodash/isPlainObject');
const get = require('lodash/get');
const getKeys = require('./get-object-keys');
const getSize = require('./get-size');
const set = require('lodash/set');

/*
 * TBD
 */
module.exports = (data, {depth = 1, sizes = {}} = {}) => {
  // @TODO: implement depth?
  // @TODO: throw error if data is not object?
  if (!isObject(data)) return {};
  // set all the sizes
  for (const path of getKeys(data, {depth, expandArrays: false})) set(sizes, path, getSize(get(data, path)));
  // return sizes
  return sizes;
};
