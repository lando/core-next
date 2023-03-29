// @TODO: simplify lodash usage to just merge?
'use strict';

class ComposeService {
  constructor(id, info = {}, ...sources) {
    this.id = id;
    this.info = info;
    this.data = _(sources).map(source => _.merge({}, source, {version: '3.6'})).value();
  }
}

module.exports = ComposeService;
