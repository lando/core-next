import isObject from 'lodash-es/isPlainObject.js';
import kebabcaseKeys from 'kebabcase-keys';

export default (data) => {
  // return non objects with no mutation
  if (!isObject(data)) return data;
  // mutate keys and return unless the key is in plugin format
  return kebabcaseKeys(data, { deep: true, exclude: [new RegExp('(^@).*/')] });
};
