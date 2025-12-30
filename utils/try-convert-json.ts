'use strict';

module.exports = value => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
