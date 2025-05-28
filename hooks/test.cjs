// const formatters = require('./../lib/formatters');
'use strict';

module.exports = async (thing) => {
  console.log(thing.config.get());
  thing.debug('hello there!');
};
