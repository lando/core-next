'use strict';

const axios = require('axios');

module.exports = (opts = {}, httpOpts = {}, httpsOpts = {}) =>
  axios.create({
    adapter: 'fetch',
    ...opts,
    proxy: false,
  });
