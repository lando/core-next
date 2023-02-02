'use strict';

const {customAlphabet} = require('nanoid');
const nanoid = customAlphabet('1234567890abcdefl', 17);
/*
 * TBD
 */
module.exports = () => nanoid();
