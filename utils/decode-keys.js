import camelcaseKeys from 'camelcase-keys';
import isObject from 'lodash-es/isPlainObject.js';

export default (data) => {
  // return non objects with no mutation
  if (!isObject(data)) return data;
  // mutate keys and return
  return camelcaseKeys(data, { deep: true });
};
